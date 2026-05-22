import { execFile } from 'node:child_process';
import { access, lstat, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { isValidObjectId } from 'mongoose';
import { IServicesService, Service } from '../../services/interfaces/ServiceInterface';
import { NginxDomain, NginxDomainPayload, NginxStatus } from '../interfaces/NginxInterface';
import { NginxSchema } from '../schemas/NginxSchema';

type Injectable = object;

const execFileAsync = promisify(execFile);

export class NginxService {
  private dependencies = new Map<string, Injectable>();
  private sitesAvailable = process.env.NGINX_SITES_AVAILABLE || '/etc/nginx/sites-available/';
  private sitesEnabled = process.env.NGINX_SITES_ENABLED || '/etc/nginx/sites-enabled/';

  inject(name: string, instance: Injectable): this {
    this.dependencies.set(name, instance);
    return this;
  }

  get<T>(name: string): T {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency '${name}' is not injected`);
    }
    return dependency as T;
  }

  async listDomains(): Promise<NginxDomain[]> {
    const domains = await NginxSchema.find().sort({ createdAt: -1 }).exec();
    return domains.map(domain => domain.toJSON() as NginxDomain);
  }

  async getDomain(id: string): Promise<NginxDomain | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const domain = await NginxSchema.findById(id).exec();
    return domain ? domain.toJSON() as NginxDomain : null;
  }

  async createDomain(payload: NginxDomainPayload): Promise<NginxDomain> {
    const normalized = await this.normalizePayload(payload);
    const domain = await NginxSchema.create({ ...normalized, sslEnabled: false });
    const nginxDomain = domain.toJSON() as NginxDomain;

    try {
      await this.writeConfig(nginxDomain);
      await this.syncEnabledConfig(nginxDomain);
      if (nginxDomain.serviceId && nginxDomain.port) {
        await this.reload();
      }
    } catch (error) {
      await NginxSchema.findByIdAndDelete(nginxDomain.id).exec();
      throw error;
    }

    return nginxDomain;
  }

  async updateDomain(id: string, payload: NginxDomainPayload): Promise<NginxDomain | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const current = await NginxSchema.findById(id).exec();
    if (!current) {
      return null;
    }

    const previousFile = this.getConfigPath(current.domain);
    const normalized = await this.normalizePayload(payload, current.domain);
    const updated = await NginxSchema.findByIdAndUpdate(id, normalized, { new: true, runValidators: true }).exec();
    if (!updated) {
      return null;
    }

    const domain = updated.toJSON() as NginxDomain;
    if (previousFile !== this.getConfigPath(domain.domain)) {
      await this.removeConfigFile(current.domain);
      await this.removeEnabledConfig(current.domain);
    }

    await this.writeConfig(domain);
    await this.syncEnabledConfig(domain);
    await this.reload();
    return domain;
  }

  async deleteDomain(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }

    const domain = await NginxSchema.findById(id).exec();
    if (!domain) {
      return false;
    }

    await this.removeConfigFile(domain.domain);
    await this.removeEnabledConfig(domain.domain);
    await this.reload();
    await NginxSchema.findByIdAndDelete(id).exec();
    return true;
  }

  async applySsl(id: string): Promise<NginxDomain | null> {
    const domain = await this.getDomain(id);
    if (!domain) {
      return null;
    }
    if (!domain.serviceId || !domain.port) {
      throw new Error('Domain must be linked to a service before enabling SSL');
    }

    await this.ensureEnabledConfig(domain);
    await this.runCommand('certbot', ['--nginx', '-d', domain.domain, '--non-interactive', '--agree-tos', '-m', `admin@${domain.domain}`]);

    const updated = await NginxSchema.findByIdAndUpdate(id, { sslEnabled: true }, { new: true, runValidators: true }).exec();
    if (!updated) {
      return null;
    }

    const updatedDomain = updated.toJSON() as NginxDomain;
    await this.writeConfig(updatedDomain);
    await this.reload();
    return updatedDomain;
  }

  async getStatus(): Promise<NginxStatus> {
    const [test, running, version] = await Promise.allSettled([
      this.runCommand('nginx', ['-t']),
      this.runCommand('pgrep', ['nginx']),
      this.runCommand('nginx', ['-v']),
    ]);

    const valid = test.status === 'fulfilled';
    const isRunning = running.status === 'fulfilled';
    const testMessage = test.status === 'fulfilled' ? test.value : test.reason instanceof Error ? test.reason.message : String(test.reason);
    const versionMessage = version.status === 'fulfilled' ? version.value : undefined;

    return {
      valid,
      running: isRunning,
      message: testMessage,
      version: versionMessage,
    };
  }

  async reload(): Promise<NginxStatus> {
    await this.runCommand('nginx', ['-t']);
    await this.runCommand('nginx', ['-s', 'reload']);
    return this.getStatus();
  }

  private async normalizePayload(payload: NginxDomainPayload, fallbackDomain?: string): Promise<NginxDomainPayload> {
    const domain = this.normalizeDomain(payload.domain || fallbackDomain || '');
    const linked = await this.normalizeLink(payload.serviceId, payload.port);

    return {
      domain,
      serviceId: linked.serviceId,
      port: linked.port,
    };
  }

  private normalizeDomain(domain: string): string {
    const normalized = domain.trim().toLowerCase();
    const valid = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(normalized)
      && !normalized.split('.').some(part => part.startsWith('-') || part.endsWith('-'));

    if (!valid) {
      throw new Error('Valid domain is required');
    }

    return normalized;
  }

  private async normalizeLink(serviceId?: string | null, port?: number | null): Promise<{ serviceId: string | null; port: number | null }> {
    if (!serviceId) {
      return { serviceId: null, port: null };
    }

    if (!isValidObjectId(serviceId)) {
      throw new Error('Valid service is required');
    }

    const servicesService = this.get<IServicesService>('servicesService');
    const deployedServices = await servicesService.listDeployedServices();
    const service = deployedServices.find(item => item.id === serviceId);
    if (!service) {
      throw new Error('Service must be deployed before linking a domain');
    }

    return { serviceId, port: this.resolvePort(service, port) };
  }

  private resolvePort(service: Service, port?: number | null): number {
    const ports = service.ports.filter(item => item.protocol === 'tcp' && item.hostPort);
    if (!ports.length) {
      throw new Error('Service has no TCP host ports available');
    }

    if (port) {
      const selected = ports.find(item => item.hostPort === port);
      if (!selected) {
        throw new Error('Selected port does not belong to the service');
      }
      return selected.hostPort;
    }

    if (ports.length > 1) {
      throw new Error('Port is required when service exposes multiple TCP ports');
    }

    return ports[0].hostPort;
  }

  private async writeConfig(domain: NginxDomain): Promise<void> {
    await access(this.sitesAvailable);
    await writeFile(this.getConfigPath(domain.domain), this.renderConfig(domain), 'utf8');
  }

  private renderConfig(domain: NginxDomain): string {
    if (!domain.serviceId || !domain.port) {
      return `server {
    listen 80;
    server_name ${domain.domain};

    location / {
        return 404;
    }
}
`;
    }

    if (domain.sslEnabled) {
      return `server {
    listen 80;
    server_name ${domain.domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain.domain};

    ssl_certificate /etc/letsencrypt/live/${domain.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain.domain}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:${domain.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
    }

    return `server {
    listen 80;
    server_name ${domain.domain};

    location / {
        proxy_pass http://127.0.0.1:${domain.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
  }

  private async syncEnabledConfig(domain: NginxDomain): Promise<void> {
    if (!domain.serviceId || !domain.port) {
      await this.removeEnabledConfig(domain.domain);
      return;
    }

    await this.ensureEnabledConfig(domain);
  }

  private async ensureEnabledConfig(domain: NginxDomain): Promise<void> {
    await access(this.sitesEnabled);
    const enabledPath = this.getEnabledPath(domain.domain);
    try {
      const stats = await lstat(enabledPath);
      if (stats.isSymbolicLink()) {
        return;
      }
      throw new Error(`Enabled nginx config '${enabledPath}' already exists and is not a symlink`);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
    }

    await symlink(this.getConfigPath(domain.domain), enabledPath);
  }

  private async removeConfigFile(domain: string): Promise<void> {
    await rm(this.getConfigPath(domain), { force: true });
  }

  private async removeEnabledConfig(domain: string): Promise<void> {
    await rm(this.getEnabledPath(domain), { force: true });
  }

  private getConfigPath(domain: string): string {
    return path.join(this.sitesAvailable, this.getFileName(domain));
  }

  private getEnabledPath(domain: string): string {
    return path.join(this.sitesEnabled, this.getFileName(domain));
  }

  private getFileName(domain: string): string {
    return domain.replace(/\./g, '_');
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    try {
      const result = await execFileAsync(command, args);
      return [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }
}

import { isValidObjectId } from 'mongoose';
import { ITemplatesService } from '../../templates/interfaces/TemplateInterface';
import { Service, ServicePayload } from '../interfaces/ServiceInterface';
import { ServiceSchema } from '../schemas/ServiceSchema';

type Injectable = object;

export class ServicesService {
  private dependencies = new Map<string, Injectable>();

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

  async listServices(): Promise<Service[]> {
    const services = await ServiceSchema.find().sort({ createdAt: -1 }).exec();
    return services.map((service) => service.toJSON() as Service);
  }

  async getService(id: string): Promise<Service | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const service = await ServiceSchema.findById(id).exec();
    return service ? service.toJSON() as Service : null;
  }

  async createService(payload: ServicePayload): Promise<Service> {
    await this.validateService(payload);
    const service = await ServiceSchema.create(this.normalizePayload(payload));
    return service.toJSON() as Service;
  }

  async updateService(id: string, payload: ServicePayload): Promise<Service | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    await this.validateService(payload);

    const service = await ServiceSchema.findByIdAndUpdate(id, this.normalizePayload(payload), {
      new: true,
      runValidators: true,
    }).exec();

    return service ? service.toJSON() as Service : null;
  }

  async deleteService(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }

    const result = await ServiceSchema.findByIdAndDelete(id);
    return Boolean(result);
  }

  private async validateService(payload: ServicePayload): Promise<void> {
    if (!payload.name?.trim()) {
      throw new Error('Service name is required');
    }

    if (!isValidObjectId(payload.template)) {
      throw new Error('Valid template is required');
    }

    const templatesService = this.get<ITemplatesService>('templatesService');
    const template = await templatesService.getTemplate(payload.template);
    if (!template) {
      throw new Error('Template not found');
    }

    this.validateEnvironment(payload.environment ?? [], template.environment.map((item) => item.key));
    this.validatePorts(payload.ports ?? [], template.ports.map((port) => `${port.containerPort}/${port.protocol}`));
    this.validateVolumes(payload.volumes ?? [], template.volumes.map((volume) => volume.target));
  }

  private validateEnvironment(environment: ServicePayload['environment'], templateKeys: string[]): void {
    const usedKeys = new Set<string>();

    for (const item of environment) {
      const key = item.key?.trim();
      if (!key) {
        throw new Error('Environment variable key is required');
      }

      if (!templateKeys.includes(key)) {
        throw new Error(`Environment variable '${key}' does not exist in template`);
      }

      if (usedKeys.has(key)) {
        throw new Error('Duplicated environment variables are not allowed');
      }
      usedKeys.add(key);
    }

    const missing = templateKeys.find((key) => !usedKeys.has(key));
    if (missing) {
      throw new Error(`Environment variable '${missing}' is missing from template configuration`);
    }
  }

  private validatePorts(ports: ServicePayload['ports'], templatePorts: string[]): void {
    const usedPorts = new Set<string>();

    for (const port of ports) {
      if (!Number.isInteger(port.hostPort) || port.hostPort < 1 || port.hostPort > 65535) {
        throw new Error('Host ports must be integers between 1 and 65535');
      }

      if (!Number.isInteger(port.containerPort) || port.containerPort < 1 || port.containerPort > 65535) {
        throw new Error('Container ports must be integers between 1 and 65535');
      }

      if (port.protocol !== 'tcp' && port.protocol !== 'udp') {
        throw new Error('Port protocol must be tcp or udp');
      }

      const templateKey = `${port.containerPort}/${port.protocol}`;
      if (!templatePorts.includes(templateKey)) {
        throw new Error(`Container port '${templateKey}' does not exist in template`);
      }

      const hostKey = `${port.hostPort}/${port.protocol}`;
      if (usedPorts.has(hostKey)) {
        throw new Error('Duplicated host ports are not allowed');
      }
      usedPorts.add(hostKey);
    }

    const missing = templatePorts.find((templatePort) => !ports.some((port) => `${port.containerPort}/${port.protocol}` === templatePort));
    if (missing) {
      throw new Error(`Container port '${missing}' is missing from template configuration`);
    }
  }

  private validateVolumes(volumes: ServicePayload['volumes'], templateTargets: string[]): void {
    const usedTargets = new Set<string>();

    for (const volume of volumes) {
      if (!volume.source?.trim() || !volume.target?.trim()) {
        throw new Error('Volume source and target are required');
      }

      if (!templateTargets.includes(volume.target.trim())) {
        throw new Error(`Volume target '${volume.target}' does not exist in template`);
      }

      if (usedTargets.has(volume.target.trim())) {
        throw new Error('Duplicated volume targets are not allowed');
      }
      usedTargets.add(volume.target.trim());
    }

    const missing = templateTargets.find((target) => !usedTargets.has(target));
    if (missing) {
      throw new Error(`Volume target '${missing}' is missing from template configuration`);
    }
  }

  private normalizePayload(payload: ServicePayload): ServicePayload {
    return {
      name: payload.name.trim(),
      template: payload.template,
      environment: (payload.environment ?? []).map((item) => ({
        key: item.key.trim(),
        value: item.value?.trim() || undefined,
      })),
      ports: (payload.ports ?? []).map((port) => ({
        hostPort: Number(port.hostPort),
        containerPort: Number(port.containerPort),
        protocol: port.protocol,
      })),
      volumes: (payload.volumes ?? []).map((volume) => ({
        source: volume.source.trim(),
        target: volume.target.trim(),
        readOnly: Boolean(volume.readOnly),
      })),
    };
  }
}

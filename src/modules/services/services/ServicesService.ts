import Docker from 'dockerode';
import { isValidObjectId } from 'mongoose';
import { IImagesService } from '../../images/interfaces/ImagesInterface';
import { ITemplatesService } from '../../templates/interfaces/TemplateInterface';
import { Service, ServiceDeployPayload, ServiceDeployResult, ServicePayload } from '../interfaces/ServiceInterface';
import { ServiceSchema } from '../schemas/ServiceSchema';

type Injectable = object;

export class ServicesService {
  private dependencies = new Map<string, Injectable>();
  private docker = new Docker();

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

  async deployService(id: string, payload: ServiceDeployPayload): Promise<ServiceDeployResult | null> {
    const service = await this.getService(id);
    if (!service) {
      return null;
    }

    const templatesService = this.get<ITemplatesService>('templatesService');
    const template = await templatesService.getTemplate(service.template);
    if (!template) {
      throw new Error('Template not found');
    }

    const tag = payload.tag?.trim();
    if (!tag) {
      throw new Error('Image tag is required');
    }

    await this.validateImageTag(template.image, tag);

    const image = this.getImageReference(template.image, tag);
    const name = this.getContainerName(service);
    await this.removePreviousContainer(id);
    await this.pullImage(image);

    const container = await this.docker.createContainer({
      name,
      Image: image,
      Env: service.environment.map((item) => `${item.key}=${item.value ?? ''}`),
      ExposedPorts: service.ports.reduce<Record<string, Record<string, never>>>((ports, port) => {
        ports[`${port.containerPort}/${port.protocol}`] = {};
        return ports;
      }, {}),
      HostConfig: {
        PortBindings: service.ports.reduce<Record<string, Array<{ HostPort: string }>>>((ports, port) => {
          ports[`${port.containerPort}/${port.protocol}`] = [{ HostPort: String(port.hostPort) }];
          return ports;
        }, {}),
        Binds: service.volumes.map((volume) => `${volume.source}:${volume.target}${volume.readOnly ? ':ro' : ''}`),
      },
      Labels: {
        'vuelder.service.id': id,
        'vuelder.service.name': service.name,
      },
    });

    await container.start();

    return {
      containerId: container.id,
      image,
      name,
    };
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

  private async validateImageTag(image: string, tag: string): Promise<void> {
    const imagesService = this.get<IImagesService>('imagesService');
    const repositories = await imagesService.listImages();
    const repository = repositories.find((item) => item.repository === image);

    if (!repository || !repository.images.some((item) => item.name === tag)) {
      throw new Error('Selected Docker image tag is not available');
    }
  }

  private async removePreviousContainer(serviceId: string): Promise<void> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: { label: [`vuelder.service.id=${serviceId}`] },
    });

    for (const item of containers) {
      const container = this.docker.getContainer(item.Id);
      if (item.State === 'running') {
        await container.stop();
      }
      await container.remove({ force: true });
    }
  }

  private async pullImage(image: string): Promise<void> {
    const stream = await this.docker.pull(image);

    await new Promise<void>((resolve, reject) => {
      this.docker.modem.followProgress(stream, (error: Error | null) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private getImageReference(repository: string, tag: string): string {
    if (this.isQualifiedImage(repository)) {
      return `${repository}:${tag}`;
    }

    const registryUrl = process.env.DOCKER_REGISTRY_URL;
    if (!registryUrl) {
      return `${repository}:${tag}`;
    }

    return `${new URL(registryUrl).host}/${repository}:${tag}`;
  }

  private isQualifiedImage(repository: string): boolean {
    const firstSegment = repository.split('/')[0] ?? '';
    return firstSegment.includes('.') || firstSegment.includes(':') || firstSegment === 'localhost';
  }

  private getContainerName(service: Service): string {
    const safeName = service.name.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'service';
    return `vuelder-${safeName}-${service.id.slice(-6)}`;
  }
}

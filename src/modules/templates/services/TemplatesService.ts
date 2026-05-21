import { isValidObjectId } from 'mongoose';
import { ImagesService } from '../../images/services/ImagesService';
import { Template, TemplatePayload } from '../interfaces/TemplateInterface';
import { TemplateSchema } from '../schemas/TemplateSchema';

type Injectable = object;

export class TemplatesService {
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

  async listTemplates(): Promise<Template[]> {
    const templates = await TemplateSchema.find().sort({ createdAt: -1 }).exec();
    return templates.map((template) => template.toJSON() as Template);
  }

  async getTemplate(id: string): Promise<Template | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const template = await TemplateSchema.findById(id).exec();
    return template ? template.toJSON() as Template : null;
  }

  async createTemplate(payload: TemplatePayload): Promise<Template> {
    await this.validateTemplate(payload);
    const template = await TemplateSchema.create(this.normalizePayload(payload));
    return template.toJSON() as Template;
  }

  async updateTemplate(id: string, payload: TemplatePayload): Promise<Template | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    await this.validateTemplate(payload);

    const template = await TemplateSchema.findByIdAndUpdate(id, this.normalizePayload(payload), {
      new: true,
      runValidators: true,
    }).exec();

    return template ? template.toJSON() as Template : null;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }

    const result = await TemplateSchema.findByIdAndDelete(id);
    return Boolean(result);
  }

  private async validateTemplate(payload: TemplatePayload): Promise<void> {
    if (!payload.name?.trim()) {
      throw new Error('Template name is required');
    }

    if (!payload.image?.trim()) {
      throw new Error('Template image is required');
    }

    this.validatePorts(payload.ports ?? []);
    this.validateEnvironment(payload.environment ?? []);
    this.validateVolumes(payload.volumes ?? []);
    await this.validateImage(payload.image, payload.tag);
  }

  private validatePorts(ports: TemplatePayload['ports']): void {
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

      const key = `${port.hostPort}/${port.protocol}`;
      if (usedPorts.has(key)) {
        throw new Error('Duplicated host ports are not allowed');
      }
      usedPorts.add(key);
    }
  }

  private validateEnvironment(environment: TemplatePayload['environment']): void {
    const usedKeys = new Set<string>();

    for (const item of environment) {
      if (!item.key?.trim()) {
        throw new Error('Environment variable key is required');
      }

      if (usedKeys.has(item.key.trim())) {
        throw new Error('Duplicated environment variables are not allowed');
      }
      usedKeys.add(item.key.trim());
    }
  }

  private validateVolumes(volumes: TemplatePayload['volumes']): void {
    for (const volume of volumes) {
      if (!volume.source?.trim() || !volume.target?.trim()) {
        throw new Error('Volume source and target are required');
      }
    }
  }

  private async validateImage(image: string, tag?: string): Promise<void> {
    const imagesService = this.get<ImagesService>('imagesService');
    const repositories = await imagesService.listImages();
    const repository = repositories.find((item) => item.repository === image);

    if (!repository) {
      throw new Error('Selected Docker image is not available');
    }

    if (tag && !repository.images.some((item) => item.name === tag)) {
      throw new Error('Selected Docker image tag is not available');
    }
  }

  private normalizePayload(payload: TemplatePayload): TemplatePayload {
    return {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      image: payload.image.trim(),
      tag: payload.tag?.trim() || undefined,
      environment: (payload.environment ?? []).map((item) => ({
        key: item.key.trim(),
        defaultValue: item.defaultValue?.trim() || undefined,
        required: Boolean(item.required),
        secret: Boolean(item.secret),
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

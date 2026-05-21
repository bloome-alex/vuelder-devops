import { TemplateEnvironment } from './TemplateEnvironmentInterface';
import { TemplatePort } from './TemplatePortInterface';
import { TemplateVolume } from './TemplateVolumeInterface';

export interface Template {
  id: string;
  name: string;
  description?: string;
  image: string;
  tag?: string;
  environment: TemplateEnvironment[];
  ports: TemplatePort[];
  volumes: TemplateVolume[];
  createdAt: Date;
  updatedAt: Date;
}

export type TemplatePayload = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

export interface ITemplatesService {
  listTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | null>;
  createTemplate(payload: TemplatePayload): Promise<Template>;
  updateTemplate(id: string, payload: TemplatePayload): Promise<Template | null>;
  deleteTemplate(id: string): Promise<boolean>;
}

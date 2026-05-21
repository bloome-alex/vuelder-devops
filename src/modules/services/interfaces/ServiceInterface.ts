import { TemplatePort } from '../../templates/interfaces/TemplatePortInterface';
import { TemplateVolume } from '../../templates/interfaces/TemplateVolumeInterface';
import { ServiceEnvironment } from './ServiceEnvironmentInterface';

export interface Service {
  id: string;
  name: string;
  template: string;
  environment: ServiceEnvironment[];
  ports: TemplatePort[];
  volumes: TemplateVolume[];
  createdAt: Date;
  updatedAt: Date;
}

export type ServicePayload = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;

export interface IServicesService {
  listServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(payload: ServicePayload): Promise<Service>;
  updateService(id: string, payload: ServicePayload): Promise<Service | null>;
  deleteService(id: string): Promise<boolean>;
}

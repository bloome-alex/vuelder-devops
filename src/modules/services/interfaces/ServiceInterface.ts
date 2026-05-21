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

export interface ServiceDeployPayload {
  tag: string;
}

export interface ServiceDeployResult {
  containerId: string;
  image: string;
  name: string;
}

export interface IServicesService {
  listServices(search?: string, port?: string): Promise<Service[]>;
  listDeployedServices(search?: string, port?: string): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(payload: ServicePayload): Promise<Service>;
  updateService(id: string, payload: ServicePayload): Promise<Service | null>;
  deleteService(id: string): Promise<boolean>;
  undeployService(id: string): Promise<void>;
  deployService(id: string, payload: ServiceDeployPayload): Promise<ServiceDeployResult | null>;
  getTasksByServiceId(serviceId: string): Promise<unknown[]>;
  restartContainer(containerId: string): Promise<void>;
  removeContainer(containerId: string): Promise<void>;
  inspectContainer(containerId: string): Promise<unknown>;
}

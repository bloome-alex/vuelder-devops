import { Request, Response } from 'express';
import { IServicesService, ServiceDeployPayload, ServicePayload } from '../interfaces/ServiceInterface';

type Injectable = object;

export class ServicesController {
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

  index = async (_req: Request, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      res.json(await servicesService.listServices());
    } catch (error) {
      this.handleError(res, error, 'Unexpected error listing services');
    }
  };

  show = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const service = await servicesService.getService(req.params.id);

      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }

      res.json(service);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error loading service');
    }
  };

  store = async (req: Request<object, object, ServicePayload>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      res.status(201).json(await servicesService.createService(req.body));
    } catch (error) {
      this.handleError(res, error, 'Unexpected error creating service');
    }
  };

  update = async (req: Request<{ id: string }, object, ServicePayload>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const service = await servicesService.updateService(req.params.id, req.body);

      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }

      res.json(service);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error updating service');
    }
  };

  destroy = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const deleted = await servicesService.deleteService(req.params.id);

      if (!deleted) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, 'Unexpected error deleting service');
    }
  };

  deploy = async (req: Request<{ id: string }, object, ServiceDeployPayload>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const result = await servicesService.deployService(req.params.id, req.body);

      if (!result) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error deploying service');
    }
  };

  private handleError(res: Response, error: unknown, fallback: string): void {
    res.status(400).json({
      message: error instanceof Error ? error.message : fallback,
    });
  }
}

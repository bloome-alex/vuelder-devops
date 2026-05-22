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

  index = async (req: Request, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const { search, port, deployed } = req.query;

      if (deployed === 'true') {
        res.json(await servicesService.listDeployedServices(search as string, port as string));
        return;
      }

      res.json(await servicesService.listServices(search as string, port as string));
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

  getTasks = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const tasks = await servicesService.getTasksByServiceId(req.params.id);
      res.json(tasks);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error listing tasks');
    }
  };

  undeploy = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      await servicesService.undeployService(req.params.id);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, 'Unexpected error undeploying service');
    }
  };

  restartTask = async (req: Request<{ id: string; containerId: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      await servicesService.restartContainer(req.params.containerId);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, 'Unexpected error restarting container');
    }
  };

  removeTask = async (req: Request<{ id: string; containerId: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      await servicesService.removeContainer(req.params.containerId);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, 'Unexpected error removing container');
    }
  };

  inspectTask = async (req: Request<{ id: string; containerId: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const inspection = await servicesService.inspectContainer(req.params.containerId);
      res.json(inspection);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error inspecting container');
    }
  };

  getTaskLogs = async (req: Request<{ id: string; containerId: string }, object, object, { tail?: string }>, res: Response): Promise<void> => {
    try {
      const servicesService = this.get<IServicesService>('servicesService');
      const tail = Number.parseInt(req.query.tail || '200', 10);
      const logs = await servicesService.getContainerLogs(req.params.containerId, Number.isNaN(tail) ? 200 : tail);
      res.json({ logs });
    } catch (error) {
      this.handleError(res, error, 'Unexpected error loading container logs');
    }
  };

  private handleError(res: Response, error: unknown, fallback: string): void {
    res.status(400).json({
      message: error instanceof Error ? error.message : fallback,
    });
  }
}

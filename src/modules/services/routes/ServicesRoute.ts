import { Router } from 'express';
import { IRoutes } from '../../../interfaces';
import { ServicesController } from '../controllers/ServicesController';

type Injectable = object;

export class ServicesRoute implements IRoutes {
  private dependencies = new Map<string, Injectable>();
  private routes: IRoutes[] = [];

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

  add(route: IRoutes): void {
    this.routes.push(route);
  }

  registerRoutes(routes: IRoutes[]): void {
    this.routes.push(...routes);
  }

  getRoutes(): Router {
    const router = Router();
    const servicesController = this.get<ServicesController>('servicesController');

    router.get('/services', servicesController.index);
    router.get('/services/:id', servicesController.show);
    router.post('/services', servicesController.store);
    router.post('/services/:id/deploy', servicesController.deploy);
    router.delete('/services/:id/deploy', servicesController.undeploy);
    router.put('/services/:id', servicesController.update);
    router.delete('/services/:id', servicesController.destroy);
    router.get('/services/:id/tasks', servicesController.getTasks);
    router.post('/services/:id/tasks/:containerId/restart', servicesController.restartTask);
    router.delete('/services/:id/tasks/:containerId', servicesController.removeTask);
    router.get('/services/:id/tasks/:containerId', servicesController.inspectTask);

    for (const route of this.routes) {
      router.use(route.getRoutes());
    }

    return router;
  }
}

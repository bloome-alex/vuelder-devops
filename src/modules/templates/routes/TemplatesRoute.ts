import { Router } from 'express';
import { IRoutes } from '../../../interfaces';
import { TemplatesController } from '../controllers/TemplatesController';

type Injectable = object;

export class TemplatesRoute implements IRoutes {
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
    const templatesController = this.get<TemplatesController>('templatesController');

    router.get('/templates', templatesController.index);
    router.get('/templates/:id', templatesController.show);
    router.post('/templates', templatesController.store);
    router.put('/templates/:id', templatesController.update);
    router.delete('/templates/:id', templatesController.destroy);

    for (const route of this.routes) {
      router.use(route.getRoutes());
    }

    return router;
  }
}

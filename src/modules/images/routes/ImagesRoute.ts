import { Router } from 'express';
import { IRoutes } from '../../../interfaces';
import { ImagesController } from '../controllers/ImagesController';

type Injectable = object;

export class ImagesRoute implements IRoutes {
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
    const imagesController = this.get<ImagesController>('imagesController');

    router.get('/images', imagesController.index);
    router.post('/images/sync', imagesController.sync);

    for (const route of this.routes) {
      router.use(route.getRoutes());
    }

    return router;
  }
}

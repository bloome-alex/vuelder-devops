import { Router } from 'express';
import { IRoutes } from '../../../interfaces';
import { NginxController } from '../controllers/NginxController';

type Injectable = object;

export class NginxRoute implements IRoutes {
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
    const nginxController = this.get<NginxController>('nginxController');

    router.get('/nginx/domains', nginxController.index);
    router.get('/nginx/domains/:id', nginxController.show);
    router.post('/nginx/domains', nginxController.store);
    router.put('/nginx/domains/:id', nginxController.update);
    router.delete('/nginx/domains/:id', nginxController.destroy);
    router.post('/nginx/domains/:id/ssl', nginxController.ssl);
    router.get('/nginx/status', nginxController.status);
    router.post('/nginx/reload', nginxController.reload);

    for (const route of this.routes) {
      router.use(route.getRoutes());
    }

    return router;
  }
}

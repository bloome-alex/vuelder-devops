import { Router } from 'express';
import { IRoutes } from '../interfaces';

export class RouterMerger implements IRoutes {
  private routes: IRoutes[] = [];

  add(route: IRoutes): void {
    this.routes.push(route);
  }

  registerRoutes(routes: IRoutes[]): void {
    this.routes.push(...routes);
  }

  getRoutes(): Router {
    const router = Router();
    for (const route of this.routes) {
      router.use(route.getRoutes());
    }
    return router;
  }
}

import express, { Router } from 'express';
import path from 'node:path';
import { IDatabaseConnection, IRoutes } from '../interfaces';
import { Logger } from '../utils/Logger';

export class Server {
  private app = express();
  private publicPath = path.resolve(process.cwd(), 'src/public');
  private server: ReturnType<typeof this.app.listen> | null = null;
  private dependencies = new Map<string, IDatabaseConnection>();
  private routes: IRoutes | null = null;

  inject(name: string, instance: IDatabaseConnection): this {
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

  hasDependency(name: string): boolean {
    return this.dependencies.has(name);
  }

  setRoutes(routes: IRoutes): void {
    this.routes = routes;
  }

  private validateDependencies(): void {
    if (!this.hasDependency('db')) {
      throw new Error('Database connection must be injected before starting server');
    }
    if (!this.routes) {
      throw new Error('Routes must be set before starting server');
    }
  }

  async start(port: number): Promise<void> {
    this.validateDependencies();

    this.app.use(express.json());
    this.app.use(express.static(this.publicPath));
    this.app.use('/api', (req, res, next) => {
      res.on('finish', () => {
        Logger.info(`API request: ${req.method} ${req.originalUrl} ${res.statusCode}`);
      });
      next();
    });

    const router = this.routes!.getRoutes();
    this.app.use('/api', router);
    this.app.use('/api', (_req, res) => {
      res.status(404).json({ message: 'API route not found' });
    });

    const db = this.get<IDatabaseConnection>('db');
    await db.connect();

    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        Logger.info(`Server running on port ${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          Logger.info('Server stopped');
          resolve();
        });
      });
    }
  }
}

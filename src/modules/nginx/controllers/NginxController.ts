import { Request, Response } from 'express';
import { INginxService, NginxDomainPayload } from '../interfaces/NginxInterface';

type Injectable = object;

export class NginxController {
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
      const nginxService = this.get<INginxService>('nginxService');
      res.json(await nginxService.listDomains());
    } catch (error) {
      this.handleError(res, error, 'Unexpected error listing nginx domains');
    }
  };

  show = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      const domain = await nginxService.getDomain(req.params.id);
      if (!domain) {
        res.status(404).json({ message: 'Nginx domain not found' });
        return;
      }
      res.json(domain);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error loading nginx domain');
    }
  };

  store = async (req: Request<object, object, NginxDomainPayload>, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      res.status(201).json(await nginxService.createDomain(req.body));
    } catch (error) {
      this.handleError(res, error, 'Unexpected error creating nginx domain');
    }
  };

  update = async (req: Request<{ id: string }, object, NginxDomainPayload>, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      const domain = await nginxService.updateDomain(req.params.id, req.body);
      if (!domain) {
        res.status(404).json({ message: 'Nginx domain not found' });
        return;
      }
      res.json(domain);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error updating nginx domain');
    }
  };

  destroy = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      const deleted = await nginxService.deleteDomain(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: 'Nginx domain not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, 'Unexpected error deleting nginx domain');
    }
  };

  ssl = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      const domain = await nginxService.applySsl(req.params.id);
      if (!domain) {
        res.status(404).json({ message: 'Nginx domain not found' });
        return;
      }
      res.json(domain);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error enabling SSL');
    }
  };

  status = async (_req: Request, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      res.json(await nginxService.getStatus());
    } catch (error) {
      this.handleError(res, error, 'Unexpected error checking nginx status');
    }
  };

  reload = async (_req: Request, res: Response): Promise<void> => {
    try {
      const nginxService = this.get<INginxService>('nginxService');
      res.json(await nginxService.reload());
    } catch (error) {
      this.handleError(res, error, 'Unexpected error reloading nginx');
    }
  };

  private handleError(res: Response, error: unknown, fallback: string): void {
    res.status(400).json({
      message: error instanceof Error ? error.message : fallback,
    });
  }
}

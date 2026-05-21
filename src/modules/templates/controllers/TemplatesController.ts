import { Request, Response } from 'express';
import { ITemplatesService, TemplatePayload } from '../interfaces/TemplateInterface';

type Injectable = object;

export class TemplatesController {
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
      const templatesService = this.get<ITemplatesService>('templatesService');
      res.json(await templatesService.listTemplates());
    } catch (error) {
      this.handleError(res, error, 'Unexpected error listing templates');
    }
  };

  show = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const templatesService = this.get<ITemplatesService>('templatesService');
      const template = await templatesService.getTemplate(req.params.id);

      if (!template) {
        res.status(404).json({ message: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error loading template');
    }
  };

  store = async (req: Request<object, object, TemplatePayload>, res: Response): Promise<void> => {
    try {
      const templatesService = this.get<ITemplatesService>('templatesService');
      res.status(201).json(await templatesService.createTemplate(req.body));
    } catch (error) {
      this.handleError(res, error, 'Unexpected error creating template');
    }
  };

  update = async (req: Request<{ id: string }, object, TemplatePayload>, res: Response): Promise<void> => {
    try {
      const templatesService = this.get<ITemplatesService>('templatesService');
      const template = await templatesService.updateTemplate(req.params.id, req.body);

      if (!template) {
        res.status(404).json({ message: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      this.handleError(res, error, 'Unexpected error updating template');
    }
  };

  destroy = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const templatesService = this.get<ITemplatesService>('templatesService');
      const deleted = await templatesService.deleteTemplate(req.params.id);

      if (!deleted) {
        res.status(404).json({ message: 'Template not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      this.handleError(res, error, 'Unexpected error deleting template');
    }
  };

  private handleError(res: Response, error: unknown, fallback: string): void {
    res.status(400).json({
      message: error instanceof Error ? error.message : fallback,
    });
  }
}

import { Request, Response } from 'express';
import { IImagesService } from '../interfaces/ImagesInterface';

type Injectable = object;

export class ImagesController {
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
      const imagesService = this.get<IImagesService>('imagesService');
      const images = await imagesService.listImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unexpected error listing images',
      });
    }
  };

  sync = async (_req: Request, res: Response): Promise<void> => {
    try {
      const imagesService = this.get<IImagesService>('imagesService');
      const result = await imagesService.syncImages();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unexpected error syncing images',
      });
    }
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    try {
      const repository = typeof req.query.repository === 'string' ? req.query.repository.trim() : '';
      const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';

      if (!repository || !tag) {
        res.status(400).json({ message: 'Repository and tag are required' });
        return;
      }

      const imagesService = this.get<IImagesService>('imagesService');
      const deleted = await imagesService.deleteImage(repository, tag);
      if (!deleted) {
        res.status(404).json({ message: 'Image not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unexpected error deleting image',
      });
    }
  };
}

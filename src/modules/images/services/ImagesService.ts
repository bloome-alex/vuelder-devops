import Docker from 'dockerode';
import {
  IDockerCatalogResponse,
  IDockerConfigResponse,
  IDockerManifestResponse,
  IDockerTagsResponse,
  IImageRepository,
  IImageTag,
} from '../interfaces/ImagesInterface';

type Injectable = object;

export class ImagesService {
  private dependencies = new Map<string, Injectable>();
  private docker: Docker | null = null;

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

  async listImages(): Promise<IImageRepository[]> {
    const catalog = await this.requestRegistry<IDockerCatalogResponse>('/v2/_catalog');
    const repositories = catalog.repositories ?? [];

    return Promise.all(
      repositories.map(async (repository) => {
        const repositoryPath = repository.split('/').map(encodeURIComponent).join('/');
        const tags = await this.requestRegistry<IDockerTagsResponse>(`/v2/${repositoryPath}/tags/list`);
        const images = await this.listTagsWithCreationDate(repositoryPath, tags.tags ?? []);

        return {
          repository,
          images,
        };
      }),
    );
  }

  private async listTagsWithCreationDate(repositoryPath: string, tags: string[]): Promise<IImageTag[]> {
    const images = await Promise.all(
      tags.map(async (tag) => ({
        name: tag,
        createdAt: await this.getTagCreatedAt(repositoryPath, tag),
      })),
    );

    return images.sort((current, next) => this.compareCreatedAtDesc(current.createdAt, next.createdAt));
  }

  private async getTagCreatedAt(repositoryPath: string, tag: string): Promise<string | null> {
    try {
      const manifest = await this.requestRegistry<IDockerManifestResponse>(`/v2/${repositoryPath}/manifests/${encodeURIComponent(tag)}`, {
        Accept: [
          'application/vnd.docker.distribution.manifest.v2+json',
          'application/vnd.oci.image.manifest.v1+json',
        ].join(', '),
      });

      if (!manifest.config?.digest) {
        return null;
      }

      const config = await this.requestRegistry<IDockerConfigResponse>(
        `/v2/${repositoryPath}/blobs/${manifest.config.digest}`,
      );

      return config.created ?? null;
    } catch {
      return null;
    }
  }

  private compareCreatedAtDesc(current: string | null, next: string | null): number {
    if (!current && !next) {
      return 0;
    }

    if (!current) {
      return 1;
    }

    if (!next) {
      return -1;
    }

    return new Date(next).getTime() - new Date(current).getTime();
  }

  private async requestRegistry<T>(path: string, headers?: Record<string, string>): Promise<T> {
    const docker = this.getDockerClient();

    return new Promise<T>((resolve, reject) => {
      docker.modem.dial(
        {
          path,
          method: 'GET',
          headers,
          statusCodes: {
            200: true,
          },
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (Buffer.isBuffer(result)) {
            resolve(JSON.parse(result.toString()) as T);
            return;
          }

          resolve(result as T);
        },
      );
    });
  }

  private getDockerClient(): Docker {
    if (this.docker) {
      return this.docker;
    }

    const registryUrl = process.env.DOCKER_REGISTRY_URL;
    if (!registryUrl) {
      throw new Error('DOCKER_REGISTRY_URL environment variable is not defined');
    }

    const url = new URL(registryUrl);
    const protocol = url.protocol.replace(':', '');
    if (protocol !== 'http' && protocol !== 'https') {
      throw new Error('DOCKER_REGISTRY_URL must use http or https protocol');
    }

    this.docker = new Docker({
      protocol,
      host: url.hostname,
      port: url.port || undefined,
    });

    return this.docker;
  }
}

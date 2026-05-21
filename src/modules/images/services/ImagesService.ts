import Docker from 'dockerode';
import { IDockerCatalogResponse, IDockerTagsResponse, IImageRepository } from '../interfaces/ImagesInterface';

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
        return {
          repository,
          images: tags.tags ?? [],
        };
      }),
    );
  }

  private async requestRegistry<T>(path: string): Promise<T> {
    const docker = this.getDockerClient();

    return new Promise<T>((resolve, reject) => {
      docker.modem.dial(
        {
          path,
          method: 'GET',
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

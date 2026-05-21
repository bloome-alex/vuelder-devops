import {
  IDockerCatalogResponse,
  IDockerConfigResponse,
  IDockerManifestResponse,
  IDockerTagsResponse,
  IImageRepository,
  IImageTag,
} from '../interfaces/ImagesInterface';

type Injectable = object;
const REGISTRY_REQUEST_TIMEOUT_MS = 10000;

export class ImagesService {
  private dependencies = new Map<string, Injectable>();
  private registryUrl: URL | null = null;

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

    const imagesByRepository = await Promise.all(
      repositories.map(async (repository) => this.getRepositoryImages(repository)),
    );

    return imagesByRepository;
  }

  private async getRepositoryImages(repository: string): Promise<IImageRepository> {
    try {
      const repositoryPath = repository.split('/').map(encodeURIComponent).join('/');
      const tags = await this.requestRegistry<IDockerTagsResponse>(`/v2/${repositoryPath}/tags/list`);
      const images = await this.listTagsWithMetadata(repositoryPath, tags.tags ?? []);

      return {
        repository,
        images,
      };
    } catch {
      return {
        repository,
        images: [],
      };
    }
  }

  private async listTagsWithMetadata(repositoryPath: string, tags: string[]): Promise<IImageTag[]> {
    const images = await Promise.all(
      tags.map(async (tag) => this.getTagMetadata(repositoryPath, tag)),
    );

    return images.sort((current, next) => this.compareCreatedAtDesc(current.createdAt, next.createdAt));
  }

  private async getTagMetadata(repositoryPath: string, tag: string): Promise<IImageTag> {
    try {
      const manifest = await this.requestRegistry<IDockerManifestResponse>(`/v2/${repositoryPath}/manifests/${encodeURIComponent(tag)}`, {
        Accept: [
          'application/vnd.docker.distribution.manifest.v2+json',
          'application/vnd.oci.image.manifest.v1+json',
        ].join(', '),
      });

      if (!manifest.config?.digest) {
        return {
          name: tag,
          createdAt: null,
          digest: null,
          size: this.getManifestSize(manifest),
        };
      }

      const config = await this.requestRegistry<IDockerConfigResponse>(
        `/v2/${repositoryPath}/blobs/${manifest.config.digest}`,
      );

      return {
        name: tag,
        createdAt: config.created ?? null,
        digest: manifest.config.digest,
        size: this.getManifestSize(manifest),
      };
    } catch {
      return {
        name: tag,
        createdAt: null,
        digest: null,
        size: null,
      };
    }
  }

  private getManifestSize(manifest: IDockerManifestResponse): number | null {
    const sizes = [manifest.config?.size, ...(manifest.layers ?? []).map((layer) => layer.size)];
    const total = sizes.reduce<number>((sum, size) => sum + (size ?? 0), 0);

    return total > 0 ? total : null;
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
    const registryUrl = this.getRegistryUrl();
    const requestUrl = new URL(path, registryUrl);

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(REGISTRY_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new Error(`Docker registry request failed for ${path}: ${this.getErrorMessage(error)}`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Docker registry responded ${response.status} for ${path}${body ? `: ${body}` : ''}`);
    }

    try {
      return await response.json() as T;
    } catch (error) {
      throw new Error(`Docker registry returned invalid JSON for ${path}: ${this.getErrorMessage(error)}`);
    }
  }

  private getRegistryUrl(): URL {
    if (this.registryUrl) {
      return this.registryUrl;
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

    this.registryUrl = url;

    return this.registryUrl;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

import {
  IDockerCatalogResponse,
  IDockerConfigResponse,
  IDockerManifestResponse,
  IDockerTagsResponse,
  IImageRepository,
  IImageRecord,
  IImageSyncResult,
  IImageTag,
} from '../interfaces/ImagesInterface';
import { ImageSchema } from '../schemas/ImageSchema';

type Injectable = object;
const REGISTRY_REQUEST_TIMEOUT_MS = 10000;
const MANIFEST_ACCEPT_HEADER = [
  'application/vnd.docker.distribution.manifest.v2+json',
  'application/vnd.oci.image.manifest.v1+json',
].join(', ');

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
    const images = await ImageSchema.find().sort({ repository: 1, createdAt: -1, name: 1 }).lean().exec();
    const repositories = new Map<string, IImageTag[]>();

    for (const image of images) {
      const tags = repositories.get(image.repository) ?? [];
      tags.push({
        name: image.name,
        createdAt: image.createdAt,
        digest: image.digest,
        size: image.size,
      });
      repositories.set(image.repository, tags);
    }

    return [...repositories.entries()].map(([repository, repositoryImages]) => ({
      repository,
      images: repositoryImages,
    }));
  }

  async syncImages(): Promise<IImageSyncResult> {
    const catalog = await this.requestRegistry<IDockerCatalogResponse>('/v2/_catalog');
    const repositories = catalog.repositories ?? [];
    const imagesByRepository = await Promise.all(repositories.map(async (repository) => this.getNewRepositoryImages(repository)));
    const images = imagesByRepository.flat();

    if (images.length) {
      await ImageSchema.bulkWrite(images.map((image) => ({
        updateOne: {
          filter: { repository: image.repository, name: image.name },
          update: { $setOnInsert: image },
          upsert: true,
        },
      })));
    }

    return {
      repositories: repositories.length,
      tags: imagesByRepository.reduce((total, repositoryImages) => total + repositoryImages.length, 0),
      added: images.length,
    };
  }

  async deleteImage(repository: string, tag: string): Promise<boolean> {
    const image = await ImageSchema.findOne({ repository, name: tag }).lean().exec();
    if (!image) {
      return false;
    }

    await this.deleteRegistryTag(repository, tag);
    const result = await ImageSchema.deleteOne({ repository, name: tag }).exec();

    return result.deletedCount > 0;
  }

  private async getNewRepositoryImages(repository: string): Promise<IImageRecord[]> {
    try {
      const repositoryPath = repository.split('/').map(encodeURIComponent).join('/');
      const tags = await this.requestRegistry<IDockerTagsResponse>(`/v2/${repositoryPath}/tags/list`);
      const newTags = await this.filterNewTags(repository, tags.tags ?? []);

      return this.listTagsWithMetadata(repository, repositoryPath, newTags);
    } catch {
      return [];
    }
  }

  private async filterNewTags(repository: string, tags: string[]): Promise<string[]> {
    if (!tags.length) {
      return [];
    }

    const registeredImages = await ImageSchema.find({ repository, name: { $in: tags } }).select('name').lean().exec();
    const registeredTags = new Set(registeredImages.map((image) => image.name));

    return tags.filter((tag) => !registeredTags.has(tag));
  }

  private async listTagsWithMetadata(repository: string, repositoryPath: string, tags: string[]): Promise<IImageRecord[]> {
    const images = await Promise.all(
      tags.map(async (tag) => this.getTagMetadata(repository, repositoryPath, tag)),
    );

    return images.sort((current, next) => this.compareCreatedAtDesc(current.createdAt, next.createdAt));
  }

  private async getTagMetadata(repository: string, repositoryPath: string, tag: string): Promise<IImageRecord> {
    try {
      const manifest = await this.requestRegistry<IDockerManifestResponse>(`/v2/${repositoryPath}/manifests/${encodeURIComponent(tag)}`, {
        Accept: MANIFEST_ACCEPT_HEADER,
      });

      if (!manifest.config?.digest) {
        return {
          repository,
          name: tag,
          createdAt: null,
          digest: null,
          size: this.getManifestSize(manifest),
          syncedAt: new Date(),
        };
      }

      const config = await this.requestRegistry<IDockerConfigResponse>(
        `/v2/${repositoryPath}/blobs/${manifest.config.digest}`,
      );

      return {
        repository,
        name: tag,
        createdAt: config.created ?? null,
        digest: manifest.config.digest,
        size: this.getManifestSize(manifest),
        syncedAt: new Date(),
      };
    } catch {
      return {
        repository,
        name: tag,
        createdAt: null,
        digest: null,
        size: null,
        syncedAt: new Date(),
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
    const response = await this.requestRegistryResponse(path, { method: 'GET', headers });

    try {
      return await response.json() as T;
    } catch (error) {
      throw new Error(`Docker registry returned invalid JSON for ${path}: ${this.getErrorMessage(error)}`);
    }
  }

  private async deleteRegistryTag(repository: string, tag: string): Promise<void> {
    const repositoryPath = repository.split('/').map(encodeURIComponent).join('/');
    const manifestPath = `/v2/${repositoryPath}/manifests/${encodeURIComponent(tag)}`;
    const manifestResponse = await this.requestRegistryResponse(manifestPath, {
      method: 'GET',
      headers: { Accept: MANIFEST_ACCEPT_HEADER },
      allowNotFound: true,
    });

    if (manifestResponse.status === 404) {
      return;
    }

    const digest = manifestResponse.headers.get('Docker-Content-Digest');
    if (!digest) {
      throw new Error(`Docker registry did not return a manifest digest for ${repository}:${tag}`);
    }

    await this.requestRegistryResponse(`/v2/${repositoryPath}/manifests/${encodeURIComponent(digest)}`, {
      method: 'DELETE',
      allowNotFound: true,
    });
  }

  private async requestRegistryResponse(
    path: string,
    options: { method: 'GET' | 'DELETE'; headers?: Record<string, string>; allowNotFound?: boolean },
  ): Promise<Response> {
    const registryUrl = this.getRegistryUrl();
    const requestUrl = new URL(path, registryUrl);

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        method: options.method,
        headers: options.headers,
        signal: AbortSignal.timeout(REGISTRY_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new Error(`Docker registry request failed for ${path}: ${this.getErrorMessage(error)}`);
    }

    if (response.status === 404 && options.allowNotFound) {
      return response;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Docker registry responded ${response.status} for ${path}${body ? `: ${body}` : ''}`);
    }

    return response;
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

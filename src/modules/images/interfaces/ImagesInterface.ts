export interface IImageRepository {
  repository: string;
  images: IImageTag[];
}

export interface IImageRecord extends IImageTag {
  repository: string;
  syncedAt: Date;
}

export interface IImageTag {
  name: string;
  createdAt: string | null;
  digest: string | null;
  size: number | null;
}

export interface IImageSyncResult {
  repositories: number;
  tags: number;
  added: number;
}

export interface IDockerCatalogResponse {
  repositories?: string[];
}

export interface IDockerTagsResponse {
  name: string;
  tags?: string[] | null;
}

export interface IDockerManifestResponse {
  config?: {
    digest?: string;
    size?: number;
  };
  layers?: Array<{
    size?: number;
  }>;
}

export interface IDockerConfigResponse {
  created?: string;
}

export interface IImagesService {
  listImages(): Promise<IImageRepository[]>;
  syncImages(): Promise<IImageSyncResult>;
  deleteImage(repository: string, tag: string): Promise<boolean>;
}

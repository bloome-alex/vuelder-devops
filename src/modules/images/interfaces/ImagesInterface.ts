export interface IImageRepository {
  repository: string;
  images: IImageTag[];
}

export interface IImageTag {
  name: string;
  createdAt: string | null;
  digest: string | null;
  size: number | null;
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
}

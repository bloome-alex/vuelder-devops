export interface IImageRepository {
  repository: string;
  images: string[];
}

export interface IDockerCatalogResponse {
  repositories?: string[];
}

export interface IDockerTagsResponse {
  name: string;
  tags?: string[] | null;
}

export interface IImagesService {
  listImages(): Promise<IImageRepository[]>;
}

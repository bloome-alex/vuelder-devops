export interface NginxDomain {
  id: string;
  domain: string;
  serviceId?: string | null;
  port?: number | null;
  sslEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NginxDomainPayload {
  domain: string;
  serviceId?: string | null;
  port?: number | null;
}

export interface NginxStatus {
  valid: boolean;
  running: boolean;
  message: string;
  version?: string;
}

export interface INginxService {
  listDomains(): Promise<NginxDomain[]>;
  getDomain(id: string): Promise<NginxDomain | null>;
  createDomain(payload: NginxDomainPayload): Promise<NginxDomain>;
  updateDomain(id: string, payload: NginxDomainPayload): Promise<NginxDomain | null>;
  deleteDomain(id: string): Promise<boolean>;
  applySsl(id: string): Promise<NginxDomain | null>;
  getStatus(): Promise<NginxStatus>;
  reload(): Promise<NginxStatus>;
}

export interface TemplatePort {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

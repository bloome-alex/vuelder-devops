import { Template } from '../interfaces/TemplateInterface';

export function generateCompose(template: Template): Record<string, unknown> {
  const image = template.tag ? `${template.image}:${template.tag}` : template.image;

  return {
    services: {
      [template.name]: {
        image,
        environment: template.environment.reduce<Record<string, string>>((values, item) => {
          values[item.key] = item.defaultValue ?? '';
          return values;
        }, {}),
        ports: template.ports.map((port) => `${port.hostPort}:${port.containerPort}/${port.protocol}`),
        volumes: template.volumes.map((volume) => `${volume.source}:${volume.target}${volume.readOnly ? ':ro' : ''}`),
      },
    },
  };
}

const images = [
  { name: "nginx", repository: "docker.io/library/nginx", tag: "1.25-alpine", size: "43 MB", updated: "Hace 2 horas", digest: "sha256:a82f...9c1b" },
  { name: "postgres", repository: "docker.io/library/postgres", tag: "16", size: "432 MB", updated: "Hace 5 horas", digest: "sha256:0f3a...1e77" },
  { name: "redis", repository: "docker.io/library/redis", tag: "7.2", size: "117 MB", updated: "Ayer", digest: "sha256:c91d...8aa4" },
  { name: "node", repository: "docker.io/library/node", tag: "20-alpine", size: "179 MB", updated: "Ayer", digest: "sha256:f712...51de" },
  { name: "api-gateway", repository: "registry.local/devops/api-gateway", tag: "v2.8.1", size: "96 MB", updated: "Hace 2 días", digest: "sha256:7b22...4ad1" },
  { name: "auth-service", repository: "registry.local/devops/auth-service", tag: "v1.14.0", size: "121 MB", updated: "Hace 3 días", digest: "sha256:b919...a412" },
  { name: "worker-jobs", repository: "registry.local/devops/worker-jobs", tag: "v3.2.5", size: "155 MB", updated: "Hace 4 días", digest: "sha256:4f00...7d89" },
  { name: "grafana", repository: "docker.io/grafana/grafana", tag: "10.4.2", size: "389 MB", updated: "Hace 1 semana", digest: "sha256:bd41...07cc" },
  { name: "prometheus", repository: "quay.io/prometheus/prometheus", tag: "v2.51.0", size: "244 MB", updated: "Hace 1 semana", digest: "sha256:3ea9...fa17" },
  { name: "mongo", repository: "docker.io/library/mongo", tag: "7", size: "756 MB", updated: "Hace 2 semanas", digest: "sha256:1c33...04bd" },
  { name: "rabbitmq", repository: "docker.io/library/rabbitmq", tag: "3-management", size: "255 MB", updated: "Hace 2 semanas", digest: "sha256:e515...f08e" },
  { name: "frontend-web", repository: "registry.local/devops/frontend-web", tag: "v5.9.3", size: "88 MB", updated: "Hace 3 semanas", digest: "sha256:90ad...220f" }
];

export function getImages() {
  return [...images];
}

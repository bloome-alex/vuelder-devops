async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudo completar la operación.");
  }

  return response.status === 204 ? null : response.json();
}

export function getDomains() {
  return request("/api/nginx/domains");
}

export function createDomain(payload) {
  return request("/api/nginx/domains", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateDomain(id, payload) {
  return request(`/api/nginx/domains/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteDomain(id) {
  return request(`/api/nginx/domains/${id}`, { method: "DELETE" });
}

export function applySsl(id) {
  return request(`/api/nginx/domains/${id}/ssl`, { method: "POST" });
}

export function getStatus() {
  return request("/api/nginx/status");
}

export function reloadNginx() {
  return request("/api/nginx/reload", { method: "POST" });
}

export function getDeployedServices() {
  return request("/api/services?deployed=true");
}

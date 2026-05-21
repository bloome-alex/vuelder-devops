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

export function getServices(search, port) {
  const params = new URLSearchParams({ deployed: "true" });
  if (search) params.set("search", search);
  if (port) params.set("port", port);
  const query = params.toString();
  return request(`/api/services?${query}`);
}

export function getTasks(serviceId) {
  return request(`/api/services/${serviceId}/tasks`);
}

export function restartTask(serviceId, containerId) {
  return request(`/api/services/${serviceId}/tasks/${containerId}/restart`, { method: "POST" });
}

export function removeTask(serviceId, containerId) {
  return request(`/api/services/${serviceId}/tasks/${containerId}`, { method: "DELETE" });
}

export function inspectTask(serviceId, containerId) {
  return request(`/api/services/${serviceId}/tasks/${containerId}`);
}

export function restartService(serviceId) {
  return request(`/api/services/${serviceId}/tasks`, { method: "POST" });
}

export function undeployService(serviceId) {
  return request(`/api/services/${serviceId}/deploy`, { method: "DELETE" });
}

export function deleteService(serviceId) {
  return request(`/api/services/${serviceId}`, { method: "DELETE" });
}

export function inspectService(serviceId) {
  return request(`/api/services/${serviceId}`);
}
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

export function getServices() {
  return request("/api/services");
}

export function createService(payload) {
  return request("/api/services", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateService(id, payload) {
  return request(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteService(id) {
  return request(`/api/services/${id}`, { method: "DELETE" });
}

export function deployService(id, payload) {
  return request(`/api/services/${id}/deploy`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

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

export function getTemplates() {
  return request("/api/templates");
}

export function createTemplate(payload) {
  return request("/api/templates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTemplate(id, payload) {
  return request(`/api/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteTemplate(id) {
  return request(`/api/templates/${id}`, { method: "DELETE" });
}

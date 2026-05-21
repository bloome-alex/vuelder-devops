function formatBytes(bytes) {
  if (!bytes) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDigest(value) {
  if (!value) {
    return "-";
  }

  return value.length > 20 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function getImageName(repository) {
  return repository.split("/").pop() || repository;
}

function normalizeImages(repositories) {
  return repositories.flatMap(({ repository, images }) =>
    (images || []).map(image => ({
      name: getImageName(repository),
      repository,
      tag: image.name,
      size: formatBytes(image.size),
      updated: formatDate(image.createdAt),
      digest: formatDigest(image.digest)
    }))
  );
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getImages() {
  let response;

  try {
    response = await fetchWithTimeout("/api/images");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("La carga de imágenes tardó demasiado. Revisa la conexión con el backend.");
    }

    throw new Error("No se pudo conectar con el backend de imágenes.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudieron cargar las imágenes desde el backend.");
  }

  try {
    return normalizeImages(await response.json());
  } catch {
    throw new Error("El backend devolvió una respuesta inválida para el listado de imágenes.");
  }
}

export async function syncImages() {
  let response;

  try {
    response = await fetchWithTimeout("/api/images/sync", { method: "POST" }, 60000);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("La actualización de imágenes tardó demasiado. Revisa la conexión con Docker.");
    }

    throw new Error("No se pudo conectar con el backend para actualizar imágenes.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "No se pudieron actualizar las imágenes desde Docker.");
  }

  return response.json();
}

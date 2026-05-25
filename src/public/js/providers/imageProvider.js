export function createImageProvider({ imageService, rowsPerPage = 6 }) {
  let currentPage = 1;
  let searchTerm = "";
  let images = [];
  let loading = true;
  let syncing = false;
  let deletingImage = "";
  let error = "";
  let syncMessage = "";
  const subscribers = new Set();

  function getFilteredImages() {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return images;
    }

    return images.filter(image =>
      image.name.toLowerCase().includes(term) ||
      image.repository.toLowerCase().includes(term) ||
      image.tag.toLowerCase().includes(term)
    );
  }

  function getState() {
    const filteredImages = getFilteredImages();
    const totalPages = Math.max(1, Math.ceil(filteredImages.length / rowsPerPage));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return {
      currentPage,
      totalPages,
      rowsPerPage,
      searchTerm,
      loading,
      syncing,
      deletingImage,
      error,
      syncMessage,
      totalItems: filteredImages.length,
      visibleStart: filteredImages.length ? start + 1 : 0,
      visibleEnd: Math.min(end, filteredImages.length),
      pageItems: filteredImages.slice(start, end)
    };
  }

  function notify() {
    const state = getState();
    subscribers.forEach(subscriber => subscriber(state));
  }

  async function loadImages() {
    loading = true;
    error = "";
    notify();

    try {
      images = await imageService.getImages();
    } catch (loadError) {
      images = [];
      error = loadError instanceof Error ? loadError.message : "No se pudieron cargar las imágenes.";
    } finally {
      loading = false;
      notify();
    }
  }

  async function syncImages() {
    syncing = true;
    error = "";
    syncMessage = "";
    notify();

    try {
      const result = await imageService.syncImages();
      syncMessage = `${result.added} imagen${result.added === 1 ? "" : "es"} nueva${result.added === 1 ? "" : "s"} agregada${result.added === 1 ? "" : "s"}.`;
      await loadImages();
    } catch (syncError) {
      error = syncError instanceof Error ? syncError.message : "No se pudieron actualizar las imágenes.";
    } finally {
      syncing = false;
      notify();
    }
  }

  async function deleteImage(repository, tag) {
    deletingImage = `${repository}:${tag}`;
    error = "";
    syncMessage = "";
    notify();

    try {
      await imageService.deleteImage(repository, tag);
      images = images.filter(image => image.repository !== repository || image.tag !== tag);
      syncMessage = "Imagen eliminada correctamente.";
    } catch (deleteError) {
      error = deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la imagen.";
      throw deleteError;
    } finally {
      deletingImage = "";
      notify();
    }
  }

  loadImages();

  return {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(getState());

      return () => subscribers.delete(subscriber);
    },
    setSearchTerm(value) {
      searchTerm = value;
      currentPage = 1;
      notify();
    },
    setPage(page) {
      currentPage = page;
      notify();
    },
    nextPage() {
      const { totalPages } = getState();

      if (currentPage < totalPages) {
        currentPage++;
        notify();
      }
    },
    previousPage() {
      if (currentPage > 1) {
        currentPage--;
        notify();
      }
    },
    refresh() {
      return loadImages();
    },
    syncImages() {
      return syncImages();
    },
    deleteImage(repository, tag) {
      return deleteImage(repository, tag);
    }
  };
}

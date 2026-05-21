export function createImageProvider({ imageService, rowsPerPage = 6 }) {
  let currentPage = 1;
  let searchTerm = "";
  let images = [];
  let loading = true;
  let error = "";
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
      error,
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
    }
  };
}

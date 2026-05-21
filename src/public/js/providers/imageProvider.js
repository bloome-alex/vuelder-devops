export function createImageProvider({ imageService, rowsPerPage = 6 }) {
  let currentPage = 1;
  let searchTerm = "";
  let images = imageService.getImages();
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
      images = imageService.getImages();
      notify();
    }
  };
}

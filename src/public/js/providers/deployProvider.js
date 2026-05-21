export function createDeployProvider({ deployService, rowsPerPage = 10 }) {
  let currentPage = 1;
  let searchName = "";
  let searchPort = "";
  let services = [];
  let tasks = new Map();
  let loading = true;
  let error = "";
  const subscribers = new Set();

  function getFilteredServices() {
    const name = searchName.trim().toLowerCase();
    const port = searchPort.trim();

    return services.filter(service => {
      if (name && !service.name.toLowerCase().includes(name)) {
        return false;
      }
      if (port) {
        const portNum = parseInt(port, 10);
        if (!service.ports?.some(p => p.hostPort === portNum || p.containerPort === portNum)) {
          return false;
        }
      }
      return true;
    });
  }

  function getState() {
    const filtered = getFilteredServices();
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return {
      currentPage,
      totalPages,
      rowsPerPage,
      searchName,
      searchPort,
      loading,
      error,
      totalItems: filtered.length,
      visibleStart: filtered.length ? start + 1 : 0,
      visibleEnd: Math.min(end, filtered.length),
      pageItems: filtered.slice(start, end),
      tasks
    };
  }

  function notify() {
    const state = getState();
    subscribers.forEach(subscriber => subscriber(state));
  }

  async function loadServices() {
    loading = true;
    error = "";
    notify();

    try {
      services = await deployService.getServices();
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : "No se pudieron cargar los servicios.";
      services = [];
    } finally {
      loading = false;
      notify();
    }
  }

  async function loadTasks(serviceId) {
    try {
      const serviceTasks = await deployService.getTasks(serviceId);
      tasks.set(serviceId, serviceTasks);
      notify();
    } catch (taskError) {
      tasks.set(serviceId, []);
      notify();
    }
  }

  async function restartTask(serviceId, containerId) {
    await deployService.restartTask(serviceId, containerId);
    await loadTasks(serviceId);
  }

  async function removeTask(serviceId, containerId) {
    await deployService.removeTask(serviceId, containerId);
    await loadTasks(serviceId);
  }

  async function inspectTask(serviceId, containerId) {
    return deployService.inspectTask(serviceId, containerId);
  }

  async function restartServiceTasks(serviceId) {
    const serviceTasks = tasks.get(serviceId) || [];
    for (const task of serviceTasks) {
      await deployService.restartTask(serviceId, task.id);
    }
    await loadTasks(serviceId);
  }

  async function removeService(serviceId) {
    await deployService.deleteService(serviceId);
    await loadServices();
  }

  async function inspectService(serviceId) {
    return deployService.inspectService(serviceId);
  }

  loadServices();

  return {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(getState());
      return () => subscribers.delete(subscriber);
    },
    setSearchName(value) {
      searchName = value;
      currentPage = 1;
      notify();
    },
    setSearchPort(value) {
      searchPort = value;
      currentPage = 1;
      notify();
    },
    setPage(page) {
      currentPage = page;
      notify();
    },
    nextPage() {
      if (currentPage < getState().totalPages) {
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
      return loadServices();
    },
    loadTasks(serviceId) {
      return loadTasks(serviceId);
    },
    restartTask(serviceId, containerId) {
      return restartTask(serviceId, containerId);
    },
    removeTask(serviceId, containerId) {
      return removeTask(serviceId, containerId);
    },
    inspectTask(serviceId, containerId) {
      return inspectTask(serviceId, containerId);
    },
    restartServiceTasks(serviceId) {
      return restartServiceTasks(serviceId);
    },
    removeService(serviceId) {
      return removeService(serviceId);
    },
    inspectService(serviceId) {
      return inspectService(serviceId);
    }
  };
}
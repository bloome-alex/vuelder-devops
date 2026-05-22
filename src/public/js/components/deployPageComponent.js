import { createEmptyStateComponent } from "./emptyStateComponent.js";
import { createPaginationComponent } from "./paginationComponent.js";
import { createConfirmModal } from "./confirmModalComponent.js";
import { createContainerDetailModal } from "./containerDetailModal.js";
import { createTaskLogsModal } from "./taskLogsModal.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatPorts(ports = []) {
  if (!ports.length) {
    return "-";
  }
  return ports.map(p => `${p.hostPort}→${p.containerPort}/${p.protocol}`).join(", ");
}

function createToast(container, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => toast.remove(), 3400);
}

export function renderDeployPage(container, deployProvider) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Despliegue</h2>
        <p>Listado de servicios desplegados en Docker.</p>
      </div>
      <button class="button primary" type="button" data-refresh>Actualizar</button>
    </div>

    <div class="panel">
      <div class="toolbar">
        <div class="toolbar-filters">
          <div class="search-field">
            <span>⌕</span>
            <input type="search" data-search-name placeholder="Buscar por nombre..." />
          </div>
          <div class="search-field">
            <span>⌕</span>
            <input type="search" data-search-port placeholder="Puerto..." />
          </div>
        </div>
        <div class="summary"></div>
      </div>
    </div>
  `;

  const panel = container.querySelector(".panel");
  const toolbar = container.querySelector(".toolbar");
  const summary = toolbar.querySelector(".summary");
  const refreshButton = container.querySelector("[data-refresh]");
  const searchNameInput = container.querySelector("[data-search-name]");
  const searchPortInput = container.querySelector("[data-search-port]");

  const emptyState = createEmptyStateComponent("No se encontraron servicios.");
  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  tableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Imagen:tag</th>
          <th>Puertos</th>
          <th>Fecha creación</th>
          <th>Fecha actualización</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  const tableBody = tableWrap.querySelector("tbody");

  const pagination = createPaginationComponent({
    onPrevious: () => deployProvider.previousPage(),
    onNext: () => deployProvider.nextPage(),
    onPage: page => deployProvider.setPage(page)
  });

  panel.append(emptyState.element, tableWrap, pagination.element);

  searchNameInput.addEventListener("input", event => {
    deployProvider.setSearchName(event.target.value);
  });

  searchPortInput.addEventListener("input", event => {
    deployProvider.setSearchPort(event.target.value);
  });

  refreshButton.addEventListener("click", () => {
    refreshButton.disabled = true;
    refreshButton.textContent = "Actualizando...";
    deployProvider.refresh().finally(() => {
      refreshButton.disabled = false;
      refreshButton.textContent = "Actualizar";
    });
  });

  function renderServiceRow(service, tasks) {
    return `
      <tr class="service-row" data-service-id="${escapeHtml(service.id)}">
        <td><div class="image-name"><button type="button" class="expand-icon" data-service-id="${escapeHtml(service.id)}">▼</button><span class="image-chip">▤</span>${escapeHtml(service.name)}</div></td>
        <td><span class="tag">${escapeHtml(service.template)}</span></td>
        <td>${escapeHtml(formatPorts(service.ports))}</td>
        <td>${formatDate(service.createdAt)}</td>
        <td>${formatDate(service.updatedAt)}</td>
        <td class="row-actions">
          <button type="button" class="button danger service-delete" data-service-id="${escapeHtml(service.id)}">Eliminar</button>
        </td>
      </tr>
    `;
  }

  function renderTaskCard(serviceId, task) {
    return `
      <article class="task-card">
        <div class="task-card-header">
          <div>
            <span class="task-status ${escapeHtml(task.state)}">${escapeHtml(task.state || "desconocido")}</span>
            <h4>${escapeHtml(task.name || "Tarea sin nombre")}</h4>
          </div>
          <div class="task-actions">
            <button type="button" class="button ghost task-logs" data-service-id="${escapeHtml(serviceId)}" data-task-id="${escapeHtml(task.id)}" data-task-name="${escapeHtml(task.name || task.taskId || task.id)}">Logs</button>
            <button type="button" class="button ghost task-inspect" data-service-id="${escapeHtml(serviceId)}" data-task-id="${escapeHtml(task.id)}" data-task-name="${escapeHtml(task.name || task.taskId || task.id)}">Inspeccionar</button>
          </div>
        </div>
        <div class="task-card-grid">
          <span class="task-field"><strong>Imagen</strong>${escapeHtml(task.image || "-")}</span>
          <span class="task-field"><strong>Estado Docker</strong>${escapeHtml(task.status || "-")}</span>
          <span class="task-field"><strong>Creación</strong>${formatDate(task.createdAt)}</span>
          <span class="task-field"><strong>Nodo</strong>${escapeHtml(task.node || "local")}</span>
          <span class="task-field task-id"><strong>ID tarea</strong><code>${escapeHtml(task.taskId || task.id)}</code></span>
        </div>
      </article>
    `;
  }

  function renderServices(services, tasks) {
    if (!services.length) {
      return "";
    }
    return services.map(service => renderServiceRow(service, tasks.get(service.id))).join("");
  }

  deployProvider.subscribe(state => {
    tableBody.innerHTML = renderServices(state.pageItems, state.tasks);
    emptyState.render(state.loading ? 1 : state.totalItems, state.error || "No se encontraron servicios.");
    pagination.render(state);
    summary.textContent = state.loading
      ? "Cargando..."
      : `${state.totalItems} servicio${state.totalItems === 1 ? "" : "s"}`;

    if (state.searchName) {
      searchNameInput.value = state.searchName;
    }
    if (state.searchPort) {
      searchPortInput.value = state.searchPort;
    }
  });

  let expandedServiceId = null;

  async function handleServiceRowClick(event) {
    const target = event.target;

    if (target.classList.contains("expand-icon")) {
      event.stopPropagation();
      const serviceId = target.dataset.serviceId;
      const row = tableBody.querySelector(`tr.service-row[data-service-id="${CSS.escape(serviceId)}"]`);
      const nextRow = row?.nextElementSibling;
      const isCurrentlyExpanded = nextRow?.classList.contains("task-row") && nextRow?.style.display !== "none";

      if (isCurrentlyExpanded) {
        nextRow.style.display = "none";
        target.style.transform = "rotate(0deg)";
      } else {
        if (expandedServiceId && expandedServiceId !== serviceId) {
          const prevRow = tableBody.querySelector(`tr.service-row[data-service-id="${CSS.escape(expandedServiceId)}"]`);
          const prevNextRow = prevRow?.nextElementSibling;
          if (prevNextRow?.classList.contains("task-row")) {
            prevNextRow.style.display = "none";
          }
          const prevExpandBtn = container.querySelector(`.expand-icon[data-service-id="${CSS.escape(expandedServiceId)}"]`);
          if (prevExpandBtn) {
            prevExpandBtn.style.transform = "rotate(0deg)";
          }
        }

        let taskRow = tableBody.querySelector(`tr.task-row[data-service-id="${CSS.escape(serviceId)}"]`);
        if (!taskRow) {
          taskRow = document.createElement("tr");
          taskRow.className = "task-row";
          taskRow.dataset.serviceId = serviceId;
          row.after(taskRow);
        }
        taskRow.style.display = "table-row";
        taskRow.innerHTML = `<td colspan="6"><div class="task-row-content"><div class="task-loading">Cargando tareas...</div></div></td>`;

        await deployProvider.loadTasks(serviceId, false);

        const freshTasks = deployProvider.getTasks(serviceId);
        taskRow.innerHTML = freshTasks.length
          ? `<td colspan="6"><div class="task-row-content"><div class="task-list">${freshTasks.map(task => renderTaskCard(serviceId, task)).join("")}</div></div></td>`
          : `<td colspan="6"><div class="task-row-content"><div class="empty-state visible">Sin tareas activas</div></div></td>`;
        target.style.transform = "rotate(180deg)";
        expandedServiceId = serviceId;
      }
      return;
    }

    const taskInspectBtn = target.closest(".task-inspect");
    if (taskInspectBtn) {
      const { serviceId, taskId, taskName } = taskInspectBtn.dataset;
      taskInspectBtn.disabled = true;
      taskInspectBtn.textContent = "Inspeccionando...";

      try {
        const inspection = await deployProvider.inspectTask(serviceId, taskId);
        createContainerDetailModal({
          container: { id: taskId, name: taskName },
          inspection,
          title: "Inspect de la tarea"
        });
      } catch (error) {
        createToast(container, error.message, "error");
      } finally {
        taskInspectBtn.disabled = false;
        taskInspectBtn.textContent = "Inspeccionar";
      }
      return;
    }

    const taskLogsBtn = target.closest(".task-logs");
    if (taskLogsBtn) {
      const { serviceId, taskId, taskName } = taskLogsBtn.dataset;
      createTaskLogsModal({
        task: { id: taskId, name: taskName },
        loadLogs: tail => deployProvider.getTaskLogs(serviceId, taskId, tail)
      });
      return;
    }

    const serviceDeleteBtn = target.closest(".service-delete");
    if (serviceDeleteBtn) {
      const serviceId = serviceDeleteBtn.dataset.serviceId;
      const service = deployProvider.getState()?.pageItems?.find(s => s.id === serviceId);
      createConfirmModal({
        title: "Eliminar despliegue",
        message: `¿Eliminar el despliegue de ${service?.name}? Esto detendrá y eliminará sus contenedores.`,
        confirmText: "Eliminar",
        onConfirm: async () => {
          try {
            await deployProvider.undeploy(serviceId);
            createToast(container, "Despliegue eliminado.");
          } catch (error) {
            createToast(container, error.message, "error");
          }
        }
      });
      return;
    }
  }

  tableBody.addEventListener("click", handleServiceRowClick);
}

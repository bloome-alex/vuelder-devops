import { createEmptyStateComponent } from "./emptyStateComponent.js";
import { createPaginationComponent } from "./paginationComponent.js";
import { createConfirmModal } from "./confirmModalComponent.js";
import { createContainerDetailModal } from "./containerDetailModal.js";

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
    const taskRows = (tasks || []).map(task => `
      <tr class="task-row" data-service-id="${escapeHtml(service.id)}" data-task-id="${escapeHtml(task.id)}">
        <td colspan="6">
          <div class="task-row-content">
            <div class="task-info">
              <span class="task-field"><strong>Estado:</strong> ${escapeHtml(task.state)}</span>
              <span class="task-field"><strong>Creación:</strong> ${formatDate(task.createdAt)}</span>
              <span class="task-field"><strong>Actualización:</strong> ${formatDate(task.status)}</span>
              <span class="task-field"><strong>Nodo:</strong> ${escapeHtml(task.node)}</span>
              <span class="task-field"><strong>Tarea:</strong> <code>${escapeHtml(task.taskId)}</code></span>
            </div>
            <div class="task-actions">
              <button type="button" class="button ghost task-restart" data-service-id="${escapeHtml(service.id)}" data-task-id="${escapeHtml(task.id)}">Reiniciar</button>
              <button type="button" class="button ghost task-inspect" data-service-id="${escapeHtml(service.id)}" data-task-id="${escapeHtml(task.id)}">Inspeccionar</button>
            </div>
          </div>
        </td>
      </tr>
    `).join("");

    return `
      <tr class="service-row" data-service-id="${escapeHtml(service.id)}">
        <td><div class="image-name"><span class="image-chip">▤</span>${escapeHtml(service.name)}</div></td>
        <td><span class="tag">${escapeHtml(service.template)}</span></td>
        <td>${escapeHtml(formatPorts(service.ports))}</td>
        <td>${formatDate(service.createdAt)}</td>
        <td>${formatDate(service.updatedAt)}</td>
        <td class="row-actions">
          <button type="button" class="button ghost service-expand" data-service-id="${escapeHtml(service.id)}">Ver tareas</button>
          <button type="button" class="button ghost service-inspect" data-service-id="${escapeHtml(service.id)}">Inspeccionar</button>
          <button type="button" class="button ghost service-restart" data-service-id="${escapeHtml(service.id)}">Reiniciar</button>
          <button type="button" class="button danger service-delete" data-service-id="${escapeHtml(service.id)}">Eliminar</button>
        </td>
      </tr>
      ${taskRows}
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

  container.onclick = async event => {
    const expandBtn = event.target.closest(".service-expand");
    if (expandBtn) {
      const serviceId = expandBtn.dataset.serviceId;
      const existingTasks = deployProvider._state?.tasks?.get(serviceId);
      if (!existingTasks) {
        await deployProvider.loadTasks(serviceId);
      }
      const row = tableBody.querySelector(`tr.service-row[data-service-id="${CSS.escape(serviceId)}"]`);
      const nextRow = row?.nextElementSibling;
      if (nextRow?.classList.contains("task-row")) {
        nextRow.remove();
      } else {
        const service = deployProvider._state?.pageItems?.find(s => s.id === serviceId);
        if (service) {
          const tasks = deployProvider._state?.tasks?.get(serviceId) || [];
          const tempDiv = document.createElement("tr");
          tempDiv.className = "task-row";
          tempDiv.dataset.serviceId = serviceId;
          tempDiv.innerHTML = `<td colspan="6"><div class="task-row-content"><div class="task-loading">Cargando tareas...</div></div></td>`;
          row.after(tempDiv);
          await deployProvider.loadTasks(serviceId);
          const freshTasks = deployProvider._state?.tasks?.get(serviceId) || [];
          tempDiv.innerHTML = freshTasks.length
            ? `<td colspan="6"><div class="task-row-content"><div class="task-info">${freshTasks.map(t => `<span class="task-field"><strong>Estado:</strong> ${escapeHtml(t.state)}</span><span class="task-field"><strong>Creación:</strong> ${formatDate(t.createdAt)}</span><span class="task-field"><strong>Nodo:</strong> ${escapeHtml(t.node)}</span><span class="task-field"><strong>Tarea:</strong> <code>${escapeHtml(t.taskId)}</code></span></div><div class="task-actions"><button type="button" class="button ghost task-restart" data-service-id="${escapeHtml(serviceId)}" data-task-id="${escapeHtml(t.id)}">Reiniciar</button><button type="button" class="button ghost task-inspect" data-service-id="${escapeHtml(serviceId)}" data-task-id="${escapeHtml(t.id)}">Inspeccionar</button></div>`).join("")}</div></td>`
            : `<td colspan="6"><div class="task-row-content"><div class="empty-state visible">Sin tareas activas</div></div></td>`;
        }
      }
      return;
    }

    const taskRestartBtn = event.target.closest(".task-restart");
    if (taskRestartBtn) {
      const { serviceId, taskId } = taskRestartBtn.dataset;
      createConfirmModal({
        title: "Reiniciar tarea",
        message: "¿Reiniciar este contenedor?",
        confirmText: "Reiniciar",
        onConfirm: async () => {
          try {
            await deployProvider.restartTask(serviceId, taskId);
            createToast(container, "Tarea reiniciada.");
          } catch (error) {
            createToast(container, error.message, "error");
          }
        }
      });
      return;
    }

    const taskInspectBtn = event.target.closest(".task-inspect");
    if (taskInspectBtn) {
      const { serviceId, taskId } = taskInspectBtn.dataset;
      try {
        const inspection = await deployProvider.inspectTask(serviceId, taskId);
        const task = deployProvider._state?.tasks?.get(serviceId)?.find(t => t.id === taskId);
        createContainerDetailModal({ container: task, inspection });
      } catch (error) {
        createToast(container, error.message, "error");
      }
      return;
    }

    const serviceInspectBtn = event.target.closest(".service-inspect");
    if (serviceInspectBtn) {
      const serviceId = serviceInspectBtn.dataset.serviceId;
      try {
        const inspection = await deployProvider.inspectService(serviceId);
        const service = deployProvider._state?.pageItems?.find(s => s.id === serviceId);
        createContainerDetailModal({ container: service, inspection });
      } catch (error) {
        createToast(container, error.message, "error");
      }
      return;
    }

    const serviceRestartBtn = event.target.closest(".service-restart");
    if (serviceRestartBtn) {
      const serviceId = serviceRestartBtn.dataset.serviceId;
      createConfirmModal({
        title: "Reiniciar servicio",
        message: "¿Reiniciar todos los contenedores de este servicio?",
        confirmText: "Reiniciar",
        onConfirm: async () => {
          try {
            await deployProvider.restartServiceTasks(serviceId);
            createToast(container, "Servicio reiniciado.");
          } catch (error) {
            createToast(container, error.message, "error");
          }
        }
      });
      return;
    }

    const serviceDeleteBtn = event.target.closest(".service-delete");
    if (serviceDeleteBtn) {
      const serviceId = serviceDeleteBtn.dataset.serviceId;
      const service = deployProvider._state?.pageItems?.find(s => s.id === serviceId);
      createConfirmModal({
        title: "Eliminar servicio",
        message: `¿Eliminar definitivamente el servicio ${service?.name} y sus contenedores?`,
        confirmText: "Eliminar",
        onConfirm: async () => {
          try {
            await deployProvider.removeService(serviceId);
            createToast(container, "Servicio eliminado.");
          } catch (error) {
            createToast(container, error.message, "error");
          }
        }
      });
      return;
    }
  };
}
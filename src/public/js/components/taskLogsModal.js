function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

export function createTaskLogsModal({ task, loadLogs, initialIntervalSeconds = 2, tail = 200 }) {
  if (document.body.querySelector(".modal-backdrop")) {
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal large task-logs-modal">
      <div class="modal-header">
        <div>
          <h3>Logs de la tarea</h3>
          <p>${escapeHtml(task.name || task.id)}</p>
        </div>
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
      <div class="logs-toolbar">
        <label>
          Actualizar cada
          <input type="number" min="1" max="60" step="1" value="${escapeHtml(initialIntervalSeconds)}" data-refresh-interval />
          segundos
        </label>
        <button type="button" class="button ghost" data-refresh-logs>Actualizar ahora</button>
        <span class="logs-status" data-logs-status>Cargando logs...</span>
      </div>
      <pre class="logs-output" data-logs-output>Cargando logs...</pre>
      <div class="modal-footer">
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
    </div>
  `;

  const output = modal.querySelector("[data-logs-output]");
  const status = modal.querySelector("[data-logs-status]");
  const intervalInput = modal.querySelector("[data-refresh-interval]");
  const refreshButton = modal.querySelector("[data-refresh-logs]");
  let timer = null;
  let loading = false;
  let closed = false;

  function getIntervalMs() {
    const seconds = Number.parseInt(intervalInput.value, 10);
    return Math.min(Math.max(Number.isNaN(seconds) ? initialIntervalSeconds : seconds, 1), 60) * 1000;
  }

  function scheduleNextLoad() {
    if (closed) {
      return;
    }

    window.clearTimeout(timer);
    timer = window.setTimeout(load, getIntervalMs());
  }

  async function load() {
    if (loading) {
      return;
    }

    loading = true;
    refreshButton.disabled = true;
    status.textContent = "Actualizando...";

    try {
      const response = await loadLogs(tail);
      if (closed) {
        return;
      }
      output.textContent = response.logs || "Sin logs disponibles.";
      output.scrollTop = output.scrollHeight;
      status.textContent = `Última actualización: ${new Intl.DateTimeFormat("es", { timeStyle: "medium" }).format(new Date())}`;
    } catch (error) {
      if (closed) {
        return;
      }
      status.textContent = error.message || "No se pudieron cargar los logs.";
    } finally {
      loading = false;
      if (!closed) {
        refreshButton.disabled = false;
      }
      scheduleNextLoad();
    }
  }

  function close() {
    closed = true;
    window.clearTimeout(timer);
    modal.remove();
  }

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest(".close-modal")) {
      close();
      return;
    }

    if (event.target.closest("[data-refresh-logs]")) {
      window.clearTimeout(timer);
      load();
    }
  });

  intervalInput.addEventListener("change", () => {
    intervalInput.value = String(Math.min(Math.max(Number.parseInt(intervalInput.value, 10) || initialIntervalSeconds, 1), 60));
    scheduleNextLoad();
  });

  document.body.append(modal);
  load();
}

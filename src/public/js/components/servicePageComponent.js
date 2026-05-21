const emptyService = {
  name: "",
  template: "",
  environment: [],
  ports: [],
  volumes: []
};

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

function cloneService(service) {
  return JSON.parse(JSON.stringify(service));
}

function getServiceId(service) {
  return service.id || service._id || "";
}

function getTemplateId(template) {
  return template.id || template._id || "";
}

function createToast(container, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => toast.remove(), 3400);
}

function findTemplate(templates, id) {
  return templates.find(template => getTemplateId(template) === id);
}

function renderTemplateOptions(templates, selectedId) {
  const options = templates.map(template => {
    const id = getTemplateId(template);
    return `<option value="${escapeHtml(id)}"${id === selectedId ? " selected" : ""}>${escapeHtml(template.name)}</option>`;
  });

  return `<option value="">Seleccionar template</option>${options.join("")}`;
}

function renderEnvironmentRow(item = {}) {
  return `
    <div class="dynamic-row environment-row">
      <input name="envKey" placeholder="KEY" value="${escapeHtml(item.key)}" />
      <input name="envValue" placeholder="Valor" value="${escapeHtml(item.value)}" />
      <button type="button" class="button ghost remove-row">Quitar</button>
    </div>
  `;
}

function renderPortRow(item = { protocol: "tcp" }) {
  return `
    <div class="dynamic-row port-row">
      <input name="hostPort" type="number" min="1" max="65535" placeholder="Host" value="${escapeHtml(item.hostPort)}" />
      <input name="containerPort" type="number" min="1" max="65535" placeholder="Contenedor" value="${escapeHtml(item.containerPort)}" />
      <select name="protocol">
        <option value="tcp" ${item.protocol !== "udp" ? "selected" : ""}>tcp</option>
        <option value="udp" ${item.protocol === "udp" ? "selected" : ""}>udp</option>
      </select>
      <button type="button" class="button ghost remove-row">Quitar</button>
    </div>
  `;
}

function renderVolumeRow(item = {}) {
  return `
    <div class="dynamic-row volume-row">
      <input name="volumeSource" placeholder="/host/path" value="${escapeHtml(item.source)}" />
      <input name="volumeTarget" placeholder="/container/path" value="${escapeHtml(item.target)}" />
      <label><input name="volumeReadOnly" type="checkbox" ${item.readOnly ? "checked" : ""} /> Solo lectura</label>
      <button type="button" class="button ghost remove-row">Quitar</button>
    </div>
  `;
}

function readForm(form) {
  const data = new FormData(form);

  return {
    name: String(data.get("name") || "").trim(),
    template: String(data.get("template") || ""),
    environment: [...form.querySelectorAll(".environment-row")].map(row => ({
      key: row.querySelector('[name="envKey"]').value.trim(),
      value: row.querySelector('[name="envValue"]').value.trim() || undefined
    })).filter(item => item.key),
    ports: [...form.querySelectorAll(".port-row")].map(row => ({
      hostPort: Number(row.querySelector('[name="hostPort"]').value),
      containerPort: Number(row.querySelector('[name="containerPort"]').value),
      protocol: row.querySelector('[name="protocol"]').value
    })).filter(item => item.hostPort || item.containerPort),
    volumes: [...form.querySelectorAll(".volume-row")].map(row => ({
      source: row.querySelector('[name="volumeSource"]').value.trim(),
      target: row.querySelector('[name="volumeTarget"]').value.trim(),
      readOnly: row.querySelector('[name="volumeReadOnly"]').checked
    })).filter(item => item.source || item.target)
  };
}

function validateAgainstTemplate(service, template) {
  const errors = [];

  if (!service.name.trim()) {
    errors.push("El nombre es requerido.");
  }

  if (!template) {
    errors.push("El template es requerido.");
    return errors;
  }

  const envKeys = new Set(template.environment.map(item => item.key));
  const serviceEnvKeys = new Set(service.environment.map(item => item.key));
  const templatePorts = new Set(template.ports.map(port => `${port.containerPort}/${port.protocol}`));
  const servicePorts = new Set(service.ports.map(port => `${port.containerPort}/${port.protocol}`));
  const templateVolumes = new Set(template.volumes.map(volume => volume.target));
  const serviceVolumes = new Set(service.volumes.map(volume => volume.target));
  const hostPorts = new Set();

  for (const key of serviceEnvKeys) {
    if (!envKeys.has(key)) {
      errors.push(`La variable ${key} no existe en el template.`);
    }
  }

  for (const key of envKeys) {
    if (!serviceEnvKeys.has(key)) {
      errors.push(`Falta la variable ${key} definida en el template.`);
    }
  }

  for (const port of service.ports) {
    if (!Number.isInteger(port.hostPort) || port.hostPort < 1 || port.hostPort > 65535) {
      errors.push("Los puertos del host deben estar entre 1 y 65535.");
    }

    if (!Number.isInteger(port.containerPort) || port.containerPort < 1 || port.containerPort > 65535) {
      errors.push("Los puertos del contenedor deben estar entre 1 y 65535.");
    }

    const templateKey = `${port.containerPort}/${port.protocol}`;
    if (!templatePorts.has(templateKey)) {
      errors.push(`El puerto ${templateKey} no existe en el template.`);
    }

    const hostKey = `${port.hostPort}/${port.protocol}`;
    if (hostPorts.has(hostKey)) {
      errors.push("No se permiten puertos host duplicados.");
    }
    hostPorts.add(hostKey);
  }

  for (const key of templatePorts) {
    if (!servicePorts.has(key)) {
      errors.push(`Falta el puerto ${key} definido en el template.`);
    }
  }

  for (const volume of service.volumes) {
    if (!volume.source || !volume.target) {
      errors.push("Los volúmenes requieren origen y destino.");
    }

    if (!templateVolumes.has(volume.target)) {
      errors.push(`El volumen ${volume.target} no existe en el template.`);
    }
  }

  for (const target of templateVolumes) {
    if (!serviceVolumes.has(target)) {
      errors.push(`Falta el volumen ${target} definido en el template.`);
    }
  }

  return [...new Set(errors)];
}

function syncEnvironment(form, template, container) {
  const current = readForm(form).environment;
  const byKey = new Map(current.map(item => [item.key, item]));
  const templateKeys = new Set(template.environment.map(item => item.key));

  for (const item of current) {
    if (!templateKeys.has(item.key)) {
      createToast(container, `La variable ${item.key} no existe en el template.`, "error");
    }
  }

  const synced = template.environment.map(item => {
    const existing = byKey.get(item.key);
    if (!existing) {
      createToast(container, `Se agregó la variable ${item.key} desde el template.`);
    }
    return { key: item.key, value: existing?.value || item.defaultValue || "" };
  });

  form.querySelector(".environment-list").innerHTML = synced.map(renderEnvironmentRow).join("");
}

function syncPorts(form, template, container) {
  const current = readForm(form).ports;
  const byContainer = new Map(current.map(port => [`${port.containerPort}/${port.protocol}`, port]));
  const templateKeys = new Set(template.ports.map(port => `${port.containerPort}/${port.protocol}`));

  for (const port of current) {
    const key = `${port.containerPort}/${port.protocol}`;
    if (!templateKeys.has(key)) {
      createToast(container, `El puerto ${key} no existe en el template.`, "error");
    }
  }

  const synced = template.ports.map(port => {
    const key = `${port.containerPort}/${port.protocol}`;
    const existing = byContainer.get(key);
    if (!existing) {
      createToast(container, `Se agregó el puerto ${key} desde el template.`);
    }
    return { ...port, hostPort: existing?.hostPort || port.hostPort };
  });

  form.querySelector(".port-list").innerHTML = synced.map(renderPortRow).join("");
}

function syncVolumes(form, template, container) {
  const current = readForm(form).volumes;
  const byTarget = new Map(current.map(volume => [volume.target, volume]));
  const templateTargets = new Set(template.volumes.map(volume => volume.target));

  for (const volume of current) {
    if (!templateTargets.has(volume.target)) {
      createToast(container, `El volumen ${volume.target} no existe en el template.`, "error");
    }
  }

  const synced = template.volumes.map(volume => {
    const existing = byTarget.get(volume.target);
    if (!existing) {
      createToast(container, `Se agregó el volumen ${volume.target} desde el template.`);
    }
    return { ...volume, source: existing?.source || volume.source, readOnly: existing?.readOnly ?? volume.readOnly };
  });

  form.querySelector(".volume-list").innerHTML = synced.map(renderVolumeRow).join("");
}

function createServiceModal({ templates, service, onSave, onClose, container }) {
  const current = cloneService({ ...emptyService, ...service });
  current.id = getServiceId(current);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal large">
      <div class="modal-header">
        <div>
          <h3>${current.id ? "Editar service" : "Crear service"}</h3>
          <p>Configura un service basado en un template Docker.</p>
        </div>
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
      <form class="template-form service-form">
        <div class="tabs">
          <button type="button" class="tab active" data-tab="general">General</button>
          <button type="button" class="tab" data-tab="environment">Variables</button>
          <button type="button" class="tab" data-tab="ports">Puertos</button>
          <button type="button" class="tab" data-tab="volumes">Volúmenes</button>
        </div>
        <div class="form-errors"></div>
        <section class="tab-panel active" data-panel="general">
          <label>Template<select name="template" required>${renderTemplateOptions(templates, current.template)}</select></label>
          <label>Nombre<input name="name" value="${escapeHtml(current.name)}" required /></label>
        </section>
        <section class="tab-panel" data-panel="environment">
          <div class="panel-actions">
            <button type="button" class="button ghost sync-environment">Obtener desde template</button>
            <button type="button" class="button add-environment">Añadir variable</button>
          </div>
          <div class="dynamic-list environment-list">${current.environment.map(renderEnvironmentRow).join("")}</div>
        </section>
        <section class="tab-panel" data-panel="ports">
          <div class="panel-actions">
            <button type="button" class="button ghost sync-ports">Obtener desde template</button>
            <button type="button" class="button add-port">Añadir puerto</button>
          </div>
          <div class="dynamic-list port-list">${current.ports.map(renderPortRow).join("")}</div>
        </section>
        <section class="tab-panel" data-panel="volumes">
          <div class="panel-actions">
            <button type="button" class="button ghost sync-volumes">Obtener desde template</button>
            <button type="button" class="button add-volume">Añadir volumen</button>
          </div>
          <div class="dynamic-list volume-list">${current.volumes.map(renderVolumeRow).join("")}</div>
        </section>
        <div class="modal-footer">
          <button type="button" class="button ghost close-modal">Cancelar</button>
          <button type="submit" class="button primary save-service">${current.id ? "Guardar" : "Crear"}</button>
        </div>
      </form>
    </div>
  `;

  const form = modal.querySelector("form");
  const errors = modal.querySelector(".form-errors");

  function selectedTemplate() {
    return findTemplate(templates, form.querySelector('[name="template"]').value);
  }

  function ensureTemplate() {
    const template = selectedTemplate();
    if (!template) {
      createToast(container, "Selecciona un template primero.", "error");
    }
    return template;
  }

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest(".close-modal")) {
      onClose();
      modal.remove();
    }

    const tab = event.target.closest(".tab");
    if (tab) {
      modal.querySelectorAll(".tab, .tab-panel").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      modal.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    }

    if (event.target.closest(".add-environment")) {
      modal.querySelector(".environment-list").insertAdjacentHTML("beforeend", renderEnvironmentRow());
    }

    if (event.target.closest(".add-port")) {
      modal.querySelector(".port-list").insertAdjacentHTML("beforeend", renderPortRow());
    }

    if (event.target.closest(".add-volume")) {
      modal.querySelector(".volume-list").insertAdjacentHTML("beforeend", renderVolumeRow());
    }

    if (event.target.closest(".sync-environment")) {
      const template = ensureTemplate();
      if (template) syncEnvironment(form, template, container);
    }

    if (event.target.closest(".sync-ports")) {
      const template = ensureTemplate();
      if (template) syncPorts(form, template, container);
    }

    if (event.target.closest(".sync-volumes")) {
      const template = ensureTemplate();
      if (template) syncVolumes(form, template, container);
    }

    if (event.target.closest(".remove-row")) {
      event.target.closest(".dynamic-row").remove();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const saveButton = form.querySelector(".save-service");
    const payload = readForm(form);
    const template = findTemplate(templates, payload.template);
    const validationErrors = validateAgainstTemplate(payload, template);
    errors.innerHTML = validationErrors.map(error => `<div>${escapeHtml(error)}</div>`).join("");

    for (const error of validationErrors) {
      createToast(container, error, "error");
    }

    if (validationErrors.length) {
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = current.id ? "Guardando..." : "Creando...";

    try {
      await onSave(payload, current.id);
      modal.remove();
    } catch (error) {
      saveButton.disabled = false;
      saveButton.textContent = current.id ? "Guardar" : "Crear";
      errors.innerHTML = `<div>${escapeHtml(error instanceof Error ? error.message : "No se pudo guardar el service.")}</div>`;
      createToast(container, error instanceof Error ? error.message : "No se pudo guardar el service.", "error");
    }
  });

  document.body.append(modal);
}

function createDetailModal({ service, template }) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3>${escapeHtml(service.name)}</h3>
          <p>Template: ${escapeHtml(template?.name || "-")}</p>
        </div>
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
      <section class="tab-panel active">
        <strong>Environment</strong>
        <pre class="detail-json">${escapeHtml(JSON.stringify(service.environment, null, 2))}</pre>
        <strong>Ports</strong>
        <pre class="detail-json">${escapeHtml(JSON.stringify(service.ports, null, 2))}</pre>
        <strong>Volumes</strong>
        <pre class="detail-json">${escapeHtml(JSON.stringify(service.volumes, null, 2))}</pre>
      </section>
    </div>
  `;

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest(".close-modal")) {
      modal.remove();
    }
  });

  document.body.append(modal);
}

function createConfirmModal({ title, message, confirmText = "Eliminar", onConfirm }) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal confirm-modal">
      <div class="modal-header"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div></div>
      <div class="modal-footer">
        <button type="button" class="button ghost cancel-confirm">Cancelar</button>
        <button type="button" class="button danger accept-confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  modal.addEventListener("click", async event => {
    if (event.target === modal || event.target.closest(".cancel-confirm")) {
      modal.remove();
      return;
    }

    if (event.target.closest(".accept-confirm")) {
      const button = event.target.closest(".accept-confirm");
      button.disabled = true;
      button.textContent = "Eliminando...";

      try {
        await onConfirm();
        modal.remove();
      } catch (error) {
        button.disabled = false;
        button.textContent = confirmText;
      }
    }
  });

  document.body.append(modal);
}

export function renderServicePage(container, { serviceService, templateService }) {
  let services = [];
  let templates = [];
  let loading = true;
  let error = "";

  async function load() {
    loading = true;
    render();

    try {
      [services, templates] = await Promise.all([serviceService.getServices(), templateService.getTemplates()]);
      error = "";
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : "No se pudieron cargar los services.";
    } finally {
      loading = false;
      render();
    }
  }

  async function saveService(payload, id) {
    if (id) {
      await serviceService.updateService(id, payload);
      createToast(container, "Service actualizado correctamente.");
    } else {
      await serviceService.createService(payload);
      createToast(container, "Service creado correctamente.");
    }
    await load();
  }

  async function removeService(id) {
    await serviceService.deleteService(id);
    createToast(container, "Service eliminado correctamente.");
    await load();
  }

  function openModal(service = emptyService) {
    createServiceModal({ templates, service, onSave: saveService, onClose: () => {}, container });
  }

  function renderRows() {
    return services.map(service => {
      const template = findTemplate(templates, service.template);
      return `
        <tr>
          <td><div class="image-name"><span class="image-chip">▤</span>${escapeHtml(service.name)}</div></td>
          <td>${escapeHtml(template?.name || "-")}</td>
          <td>${service.environment?.length || 0}</td>
          <td>${service.ports?.length || 0}</td>
          <td>${service.volumes?.length || 0}</td>
          <td>${formatDate(service.createdAt)}</td>
          <td class="row-actions">
            <button type="button" class="button ghost view-service" data-id="${escapeHtml(getServiceId(service))}">Detalle</button>
            <button type="button" class="button ghost edit-service" data-id="${escapeHtml(getServiceId(service))}">Editar</button>
            <button type="button" class="button danger delete-service" data-id="${escapeHtml(getServiceId(service))}">Eliminar</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function render() {
    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>Services</h2>
          <p>Administra services basados en templates.</p>
        </div>
        <button class="button primary create-service">Nuevo service</button>
      </div>
      <div class="panel">
        <div class="toolbar"><div class="summary">${loading ? "Cargando services..." : `${services.length} service${services.length === 1 ? "" : "s"}`}</div></div>
        ${error ? `<div class="empty-state visible">${escapeHtml(error)}</div>` : ""}
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Template</th><th>Variables</th><th>Puertos</th><th>Volúmenes</th><th>Creado</th><th>Acciones</th></tr></thead>
            <tbody>${renderRows()}</tbody>
          </table>
        </div>
        ${!loading && !error && !services.length ? `<div class="empty-state visible">No hay services creados.</div>` : ""}
      </div>
    `;
  }

  container.addEventListener("click", event => {
    if (event.target.closest(".create-service")) {
      openModal();
    }

    const action = event.target.closest("[data-id]");
    if (!action) {
      return;
    }

    const service = services.find(item => getServiceId(item) === action.dataset.id);
    if (!service) {
      return;
    }

    if (action.classList.contains("view-service")) {
      createDetailModal({ service, template: findTemplate(templates, service.template) });
    }

    if (action.classList.contains("edit-service")) {
      openModal(service);
    }

    if (action.classList.contains("delete-service")) {
      createConfirmModal({
        title: "Eliminar service",
        message: `¿Eliminar definitivamente el service ${service.name}?`,
        onConfirm: () => removeService(getServiceId(service)).catch(removeError => {
          createToast(container, removeError.message, "error");
          throw removeError;
        })
      });
    }
  });

  load();
}

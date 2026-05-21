const emptyTemplate = {
  name: "",
  description: "",
  image: "",
  tag: "",
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

function cloneTemplate(template) {
  return JSON.parse(JSON.stringify(template));
}

function getTemplateId(template) {
  return template.id || template._id || "";
}

function createToast(container, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => toast.remove(), 3200);
}

function hasOpenModal() {
  return Boolean(document.body.querySelector(".modal-backdrop"));
}

function validateTemplate(template) {
  const errors = [];
  const seenPorts = new Set();

  if (!template.name.trim()) {
    errors.push("El nombre es requerido.");
  }

  if (!template.image.trim()) {
    errors.push("La imagen es requerida.");
  }

  for (const port of template.ports) {
    if (!Number.isInteger(port.hostPort) || port.hostPort < 1 || port.hostPort > 65535) {
      errors.push("Los puertos del host deben estar entre 1 y 65535.");
    }

    if (!Number.isInteger(port.containerPort) || port.containerPort < 1 || port.containerPort > 65535) {
      errors.push("Los puertos del contenedor deben estar entre 1 y 65535.");
    }

    const key = `${port.hostPort}/${port.protocol}`;
    if (seenPorts.has(key)) {
      errors.push("No se permiten puertos duplicados.");
    }
    seenPorts.add(key);
  }

  return [...new Set(errors)];
}

function readForm(form) {
  const data = new FormData(form);
  const imageValue = data.get("image") || "";
  const [image, tag = ""] = String(imageValue).split("@@");

  return {
    name: String(data.get("name") || "").trim(),
    description: String(data.get("description") || "").trim(),
    image,
    tag,
    environment: [...form.querySelectorAll(".environment-row")].map(row => ({
      key: row.querySelector('[name="envKey"]').value.trim(),
      defaultValue: row.querySelector('[name="envDefaultValue"]').value.trim() || undefined,
      required: row.querySelector('[name="envRequired"]').checked,
      secret: row.querySelector('[name="envSecret"]').checked
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

function renderOptions(images, template) {
  const selectedValue = template.image ? `${template.image}@@${template.tag || ""}` : "";
  const options = images.flatMap(image => {
    const tags = image.tag ? [image.tag] : [""];
    return tags.map(tag => {
      const value = `${image.repository}@@${tag}`;
      const label = tag ? `${image.repository}:${tag}` : image.repository;
      return `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`;
    });
  });

  return `<option value="">Seleccionar imagen</option>${options.join("")}`;
}

function renderEnvironmentRow(item = {}) {
  return `
    <div class="dynamic-row environment-row">
      <input name="envKey" placeholder="KEY" value="${escapeHtml(item.key)}" />
      <input name="envDefaultValue" placeholder="Valor por defecto" value="${escapeHtml(item.defaultValue)}" />
      <label><input name="envRequired" type="checkbox" ${item.required ? "checked" : ""} /> Requerida</label>
      <label><input name="envSecret" type="checkbox" ${item.secret ? "checked" : ""} /> Secreta</label>
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

function createTemplateModal({ images, template, onSave, onClose }) {
  if (hasOpenModal()) {
    return;
  }

  const current = cloneTemplate({ ...emptyTemplate, ...template });
  current.id = getTemplateId(current);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal large">
      <div class="modal-header">
        <div>
          <h3>${current.id ? "Editar plantilla" : "Crear plantilla"}</h3>
          <p>Configura una plantilla reutilizable para servicios Docker.</p>
        </div>
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
      <form class="template-form">
        <div class="tabs">
          <button type="button" class="tab active" data-tab="general">General</button>
          <button type="button" class="tab" data-tab="environment">Variables</button>
          <button type="button" class="tab" data-tab="ports">Puertos</button>
          <button type="button" class="tab" data-tab="volumes">Volúmenes</button>
        </div>
        <div class="form-errors"></div>
        <section class="tab-panel active" data-panel="general">
          <label>Nombre<input name="name" value="${escapeHtml(current.name)}" required /></label>
          <label>Descripción<textarea name="description" rows="3">${escapeHtml(current.description)}</textarea></label>
          <label>Imagen Docker<select name="image" required>${renderOptions(images, current)}</select></label>
        </section>
        <section class="tab-panel" data-panel="environment">
          <div class="panel-actions"><button type="button" class="button add-environment">Añadir variable</button></div>
          <div class="dynamic-list environment-list">${current.environment.map(renderEnvironmentRow).join("")}</div>
        </section>
        <section class="tab-panel" data-panel="ports">
          <div class="panel-actions"><button type="button" class="button add-port">Añadir puerto</button></div>
          <div class="dynamic-list port-list">${current.ports.map(renderPortRow).join("")}</div>
        </section>
        <section class="tab-panel" data-panel="volumes">
          <div class="panel-actions"><button type="button" class="button add-volume">Añadir volumen</button></div>
          <div class="dynamic-list volume-list">${current.volumes.map(renderVolumeRow).join("")}</div>
        </section>
        <div class="modal-footer">
          <button type="button" class="button ghost close-modal">Cancelar</button>
          <button type="submit" class="button primary save-template">${current.id ? "Guardar" : "Crear"}</button>
        </div>
      </form>
    </div>
  `;

  const form = modal.querySelector("form");
  const errors = modal.querySelector(".form-errors");

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

    if (event.target.closest(".remove-row")) {
      event.target.closest(".dynamic-row").remove();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const saveButton = form.querySelector(".save-template");
    const payload = readForm(form);
    const validationErrors = validateTemplate(payload);
    errors.innerHTML = validationErrors.map(error => `<div>${escapeHtml(error)}</div>`).join("");

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
      errors.innerHTML = `<div>${escapeHtml(error instanceof Error ? error.message : "No se pudo guardar la plantilla.")}</div>`;
    }
  });

  document.body.append(modal);
}

function createConfirmModal({ title, message, confirmText = "Eliminar", onConfirm }) {
  if (hasOpenModal()) {
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal confirm-modal">
      <div class="modal-header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
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

export function renderTemplatePage(container, { templateService, imageService }) {
  let templates = [];
  let images = [];
  let loading = true;
  let error = "";

  async function load() {
    loading = true;
    render();

    try {
      [templates, images] = await Promise.all([templateService.getTemplates(), imageService.getImages()]);
      error = "";
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : "No se pudieron cargar las plantillas.";
    } finally {
      loading = false;
      render();
    }
  }

  async function saveTemplate(payload, id) {
    if (id) {
      await templateService.updateTemplate(id, payload);
      createToast(container, "Plantilla actualizada correctamente.");
    } else {
      await templateService.createTemplate(payload);
      createToast(container, "Plantilla creada correctamente.");
    }
    await load();
  }

  async function removeTemplate(id) {
    await templateService.deleteTemplate(id);
    createToast(container, "Plantilla eliminada correctamente.");
    await load();
  }

  function openModal(template = emptyTemplate) {
    createTemplateModal({ images, template, onSave: saveTemplate, onClose: () => {} });
  }

  function duplicate(template) {
    const copy = cloneTemplate(template);
    delete copy.id;
    delete copy._id;
    copy.name = `${copy.name} copia`;
    openModal(copy);
  }

  function renderRows() {
    return templates.map(template => `
      <tr>
        <td><div class="image-name"><span class="image-chip">▣</span>${escapeHtml(template.name)}</div></td>
        <td>${escapeHtml(template.image)}</td>
        <td><span class="tag">${escapeHtml(template.tag || "-")}</span></td>
        <td>${template.ports?.length || 0}</td>
        <td>${template.environment?.length || 0}</td>
        <td>${formatDate(template.createdAt)}</td>
        <td class="row-actions">
          <button type="button" class="button ghost edit-template" data-id="${escapeHtml(getTemplateId(template))}">Editar</button>
          <button type="button" class="button ghost duplicate-template" data-id="${escapeHtml(getTemplateId(template))}">Duplicar</button>
          <button type="button" class="button danger delete-template" data-id="${escapeHtml(getTemplateId(template))}">Eliminar</button>
        </td>
      </tr>
    `).join("");
  }

  function render() {
    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>Plantillas</h2>
          <p>Administra configuraciones reutilizables de servicios Docker.</p>
        </div>
        <button class="button primary create-template">Nueva plantilla</button>
      </div>
      <div class="panel">
        <div class="toolbar">
          <div class="summary">${loading ? "Cargando plantillas..." : `${templates.length} plantilla${templates.length === 1 ? "" : "s"}`}</div>
        </div>
        ${error ? `<div class="empty-state visible">${escapeHtml(error)}</div>` : ""}
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Imagen</th><th>Tag</th><th>Puertos</th><th>Variables</th><th>Creada</th><th>Acciones</th></tr></thead>
            <tbody>${renderRows()}</tbody>
          </table>
        </div>
        ${!loading && !error && !templates.length ? `<div class="empty-state visible">No hay plantillas creadas.</div>` : ""}
      </div>
    `;
  }

  container.onclick = event => {
    if (event.target.closest(".create-template")) {
      openModal();
    }

    const action = event.target.closest("[data-id]");
    if (!action) {
      return;
    }

    const template = templates.find(item => getTemplateId(item) === action.dataset.id);
    if (!template) {
      return;
    }

    if (action.classList.contains("edit-template")) {
      openModal(template);
    }

    if (action.classList.contains("duplicate-template")) {
      duplicate(template);
    }

    if (action.classList.contains("delete-template")) {
      createConfirmModal({
        title: "Eliminar plantilla",
        message: `¿Eliminar definitivamente la plantilla ${template.name}?`,
        onConfirm: () => removeTemplate(getTemplateId(template)).catch(removeError => {
          createToast(container, removeError.message, "error");
          throw removeError;
        })
      });
    }
  };

  load();
}

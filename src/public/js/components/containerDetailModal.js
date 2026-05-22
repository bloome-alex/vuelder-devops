function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function formatJson(data) {
  return escapeHtml(JSON.stringify(data, null, 2));
}

export function createContainerDetailModal({ container, inspection, title = "Detalle del Contenedor" }) {
  if (document.body.querySelector(".modal-backdrop")) {
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal large">
      <div class="modal-header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(container.name || container.id)}</p>
        </div>
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
      <div class="tabs">
        <button type="button" class="tab active" data-tab="general">General</button>
        <button type="button" class="tab" data-tab="spec">Spec</button>
        <button type="button" class="tab" data-tab="labels">Labels</button>
        <button type="button" class="tab" data-tab="env">Entorno</button>
        <button type="button" class="tab" data-tab="inspect">Inspect completo</button>
      </div>
      <section class="tab-panel active" data-panel="general">
        <div class="detail-grid">
          <div class="detail-item"><label>ID</label><span class="detail-code">${escapeHtml(inspection.Id)}</span></div>
          <div class="detail-item"><label>Nombre</label><span>${escapeHtml(inspection.Name)}</span></div>
          <div class="detail-item"><label>Imagen</label><span>${escapeHtml(inspection.Config?.Image || "-")}</span></div>
          <div class="detail-item"><label>Estado</label><span>${escapeHtml(inspection.State?.Status || "-")}</span></div>
          <div class="detail-item"><label>Creado</label><span>${escapeHtml(inspection.Created || "-")}</span></div>
          <div class="detail-item"><label>Path</label><span>${escapeHtml(inspection.Path || "-")}</span></div>
          <div class="detail-item"><label>Args</label><span>${escapeHtml((inspection.Args || []).join(" ") || "-")}</span></div>
        </div>
      </section>
      <section class="tab-panel" data-panel="spec">
        <pre class="detail-json">${formatJson(inspection.Config || {})}</pre>
      </section>
      <section class="tab-panel" data-panel="labels">
        <div class="detail-labels">${Object.entries(inspection.Config?.Labels || {}).map(([key, value]) => `<div class="label-item"><span class="label-key">${escapeHtml(key)}</span><span class="label-value">${escapeHtml(value)}</span></div>`).join("") || "<div class=\"empty-state visible\">Sin labels</div>"}</div>
      </section>
      <section class="tab-panel" data-panel="env">
        <div class="detail-env">${(inspection.Config?.Env || []).map(item => `<div class="env-item"><span class="env-key">${escapeHtml(item.split("=")[0])}</span><span class="env-value">${escapeHtml(item.split("=").slice(1).join("="))}</span></div>`).join("") || "<div class=\"empty-state visible\">Sin variables de entorno</div>"}</div>
      </section>
      <section class="tab-panel" data-panel="inspect">
        <pre class="detail-json">${formatJson(inspection || {})}</pre>
      </section>
      <div class="modal-footer">
        <button type="button" class="button ghost close-modal">Cerrar</button>
      </div>
    </div>
  `;

  modal.addEventListener("click", event => {
    if (event.target === modal || event.target.closest(".close-modal")) {
      modal.remove();
      return;
    }

    const tab = event.target.closest(".tab");
    if (tab) {
      modal.querySelectorAll(".tab, .tab-panel").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      modal.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    }
  });

  document.body.append(modal);
}

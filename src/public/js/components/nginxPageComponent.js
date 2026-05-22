function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function getDomainId(domain) {
  return domain.id || domain._id || "";
}

function createToast(container, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => toast.remove(), 3400);
}

function formatServiceName(services, serviceId) {
  if (!serviceId) {
    return "Sin vincular";
  }

  const service = services.find(item => item.id === serviceId || item._id === serviceId);
  return service ? service.name : serviceId;
}

function renderServiceOptions(services, selectedId) {
  return `<option value="">Sin vincular</option>${services.map(service => {
    const id = service.id || service._id || "";
    return `<option value="${escapeHtml(id)}"${id === selectedId ? " selected" : ""}>${escapeHtml(service.name)}</option>`;
  }).join("")}`;
}

function renderPortOptions(service, selectedPort) {
  if (!service) {
    return `<option value="">Seleccione un servicio</option>`;
  }

  const ports = (service.ports || []).filter(port => port.protocol === "tcp" && port.hostPort);
  if (!ports.length) {
    return `<option value="">Sin puertos TCP</option>`;
  }

  return ports.map(port => {
    const label = `${port.hostPort} -> ${port.containerPort}/${port.protocol}`;
    return `<option value="${escapeHtml(port.hostPort)}"${Number(selectedPort) === port.hostPort ? " selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

export function renderNginxPage(container, nginxService) {
  let domains = [];
  let services = [];
  let status = null;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Nginx</h2>
        <p>Administra dominios, servicios vinculados, SSL y recarga de configuración.</p>
      </div>
      <div class="row-actions">
        <button class="button ghost" type="button" data-reload>Recargar nginx</button>
        <button class="button primary" type="button" data-create>Nuevo dominio</button>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 18px;">
      <div class="toolbar">
        <div>
          <strong>Estado nginx</strong>
          <div class="summary" data-status-text>Cargando estado...</div>
        </div>
        <button class="button ghost" type="button" data-refresh-status>Actualizar estado</button>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <div class="summary" data-summary>Cargando dominios...</div>
        <button class="button ghost" type="button" data-refresh>Actualizar</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dominio</th>
              <th>Servicio Vinculado</th>
              <th>Puerto</th>
              <th>SSL</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  const tableBody = container.querySelector("tbody");
  const summary = container.querySelector("[data-summary]");
  const statusText = container.querySelector("[data-status-text]");
  const reloadButton = container.querySelector("[data-reload]");

  function renderStatus() {
    if (!status) {
      statusText.textContent = "Estado no disponible.";
      return;
    }

    const parts = [
      status.running ? "corriendo" : "detenido",
      status.valid ? "config válida" : "config inválida",
      status.version || ""
    ].filter(Boolean);
    statusText.textContent = parts.join(" · ");
  }

  function renderTable() {
    summary.textContent = `${domains.length} dominio${domains.length === 1 ? "" : "s"}`;
    if (!domains.length) {
      tableBody.innerHTML = `<tr><td colspan="5">No hay dominios configurados.</td></tr>`;
      return;
    }

    tableBody.innerHTML = domains.map(domain => {
      const id = getDomainId(domain);
      return `
        <tr>
          <td><div class="image-name"><span class="image-chip">N</span>${escapeHtml(domain.domain)}</div></td>
          <td>${escapeHtml(formatServiceName(services, domain.serviceId))}</td>
          <td>${domain.port ? escapeHtml(domain.port) : "-"}</td>
          <td>${domain.sslEnabled ? "Habilitado" : "No"}</td>
          <td class="row-actions">
            <button type="button" class="button ghost" data-edit="${escapeHtml(id)}">Editar</button>
            <button type="button" class="button ghost" data-ssl="${escapeHtml(id)}" ${domain.sslEnabled || !domain.serviceId ? "disabled" : ""}>Aplicar SSL</button>
            <button type="button" class="button danger" data-delete="${escapeHtml(id)}">Eliminar</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function refresh() {
    try {
      [domains, services, status] = await Promise.all([
        nginxService.getDomains(),
        nginxService.getDeployedServices(),
        nginxService.getStatus().catch(() => null)
      ]);
      renderStatus();
      renderTable();
    } catch (error) {
      createToast(container, error.message, "error");
    }
  }

  async function refreshStatus() {
    try {
      status = await nginxService.getStatus();
      renderStatus();
    } catch (error) {
      createToast(container, error.message, "error");
    }
  }

  function openModal(domain = null) {
    const id = domain ? getDomainId(domain) : "";
    const serviceId = domain?.serviceId || "";
    const service = services.find(item => (item.id || item._id) === serviceId);
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <form class="modal template-form" data-form>
        <div class="modal-header">
          <div>
            <h3>${domain ? "Editar dominio" : "Nuevo dominio"}</h3>
            <p>Vincula un dominio a un servicio desplegado y su puerto host.</p>
          </div>
          <button type="button" class="button ghost" data-close>Cerrar</button>
        </div>
        <div class="form-errors" data-errors></div>
        <div style="display: grid; gap: 14px; padding: 18px;">
          <label>Dominio
            <input name="domain" placeholder="api.midominio.com" value="${escapeHtml(domain?.domain || "")}" required />
          </label>
          <label>Servicio desplegado
            <select name="serviceId">${renderServiceOptions(services, serviceId)}</select>
          </label>
          <label>Puerto
            <select name="port">${renderPortOptions(service, domain?.port)}</select>
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="button ghost" data-unlink ${domain?.serviceId ? "" : "disabled"}>Desvincular</button>
          <button type="submit" class="button primary">Guardar</button>
        </div>
      </form>
    `;

    const form = backdrop.querySelector("[data-form]");
    const serviceSelect = form.querySelector('[name="serviceId"]');
    const portSelect = form.querySelector('[name="port"]');
    const errors = form.querySelector("[data-errors]");

    function close() {
      backdrop.remove();
    }

    serviceSelect.addEventListener("change", () => {
      const selected = services.find(item => (item.id || item._id) === serviceSelect.value);
      portSelect.innerHTML = renderPortOptions(selected, null);
    });

    backdrop.querySelector("[data-close]").addEventListener("click", close);
    backdrop.querySelector("[data-unlink]").addEventListener("click", async () => {
      errors.textContent = "";
      try {
        await nginxService.updateDomain(id, { domain: form.domain.value.trim(), serviceId: null, port: null });
        createToast(container, "Dominio desvinculado.");
        close();
        await refresh();
      } catch (error) {
        errors.textContent = error.message;
      }
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      errors.textContent = "";
      const payload = {
        domain: form.domain.value.trim(),
        serviceId: form.serviceId.value || null,
        port: form.serviceId.value && form.port.value ? Number(form.port.value) : null
      };

      try {
        if (domain) {
          await nginxService.updateDomain(id, payload);
        } else {
          await nginxService.createDomain(payload);
        }
        createToast(container, "Dominio guardado.");
        close();
        await refresh();
      } catch (error) {
        errors.textContent = error.message;
      }
    });

    document.body.append(backdrop);
  }

  container.querySelector("[data-create]").addEventListener("click", () => openModal());
  container.querySelector("[data-refresh]").addEventListener("click", refresh);
  container.querySelector("[data-refresh-status]").addEventListener("click", refreshStatus);
  reloadButton.addEventListener("click", async () => {
    reloadButton.disabled = true;
    try {
      status = await nginxService.reloadNginx();
      renderStatus();
      createToast(container, "Nginx recargado.");
    } catch (error) {
      createToast(container, error.message, "error");
    } finally {
      reloadButton.disabled = false;
    }
  });

  tableBody.addEventListener("click", async event => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    const sslId = event.target.dataset.ssl;

    if (editId) {
      openModal(domains.find(domain => getDomainId(domain) === editId));
      return;
    }

    if (deleteId) {
      const domain = domains.find(item => getDomainId(item) === deleteId);
      if (!window.confirm(`Eliminar ${domain?.domain || "este dominio"}?`)) {
        return;
      }
      try {
        await nginxService.deleteDomain(deleteId);
        createToast(container, "Dominio eliminado.");
        await refresh();
      } catch (error) {
        createToast(container, error.message, "error");
      }
      return;
    }

    if (sslId) {
      try {
        await nginxService.applySsl(sslId);
        createToast(container, "SSL aplicado.");
        await refresh();
      } catch (error) {
        createToast(container, error.message, "error");
      }
    }
  });

  refresh();
}

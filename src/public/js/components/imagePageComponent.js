import { createEmptyStateComponent } from "./emptyStateComponent.js";
import { createConfirmModal } from "./confirmModalComponent.js";
import { createImageTableComponent } from "./imageTableComponent.js";
import { createPaginationComponent } from "./paginationComponent.js";
import { createSearchComponent } from "./searchComponent.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

export function renderImagePage(container, imageProvider) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Imágenes</h2>
        <p>Listado de imágenes Docker registradas en la base de datos.</p>
      </div>
      <button class="button primary" type="button" data-sync-images>Actualizar imágenes con Docker</button>
    </div>

    <div class="panel">
      <div class="toolbar"></div>
    </div>
  `;

  const panel = container.querySelector(".panel");
  const toolbar = container.querySelector(".toolbar");
  const syncButton = container.querySelector("[data-sync-images]");
  const summary = document.createElement("div");
  const search = createSearchComponent({ onSearch: value => imageProvider.setSearchTerm(value) });
  const emptyState = createEmptyStateComponent("No se encontraron imágenes con el filtro ingresado.");
  const imageTable = createImageTableComponent();
  const pagination = createPaginationComponent({
    onPrevious: () => imageProvider.previousPage(),
    onNext: () => imageProvider.nextPage(),
    onPage: page => imageProvider.setPage(page)
  });

  summary.className = "summary";
  toolbar.append(search, summary);
  panel.append(emptyState.element, imageTable.element, pagination.element);

  syncButton.addEventListener("click", () => imageProvider.syncImages());
  imageTable.element.addEventListener("click", event => {
    const button = event.target.closest(".delete-image");
    if (!button) {
      return;
    }

    const { repository, tag } = button.dataset;
    if (!repository || !tag) {
      return;
    }

    createConfirmModal({
      title: "Eliminar imagen",
      message: `Se eliminará ${escapeHtml(repository)}:${escapeHtml(tag)} de Mongo y del registry.`,
      confirmText: "Eliminar",
      onConfirm: () => imageProvider.deleteImage(repository, tag)
    });
  });

  imageProvider.subscribe(state => {
    imageTable.render(state.pageItems, state.deletingImage);
    emptyState.render(state.loading ? 1 : state.totalItems, state.error || "No se encontraron imágenes con el filtro ingresado.");
    pagination.render(state);
    syncButton.disabled = state.syncing;
    syncButton.textContent = state.syncing ? "Actualizando..." : "Actualizar imágenes con Docker";
    summary.textContent = state.loading
      ? "Cargando imágenes..."
      : state.error || state.syncMessage || `${state.totalItems} imagen${state.totalItems === 1 ? "" : "es"} encontrada${state.totalItems === 1 ? "" : "s"}`;
  });
}

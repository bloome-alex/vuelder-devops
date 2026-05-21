import { createEmptyStateComponent } from "./emptyStateComponent.js";
import { createImageTableComponent } from "./imageTableComponent.js";
import { createPaginationComponent } from "./paginationComponent.js";
import { createSearchComponent } from "./searchComponent.js";

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

  imageProvider.subscribe(state => {
    imageTable.render(state.pageItems);
    emptyState.render(state.loading ? 1 : state.totalItems, state.error || "No se encontraron imágenes con el filtro ingresado.");
    pagination.render(state);
    syncButton.disabled = state.syncing;
    syncButton.textContent = state.syncing ? "Actualizando..." : "Actualizar imágenes con Docker";
    summary.textContent = state.loading
      ? "Cargando imágenes..."
      : state.syncMessage || `${state.totalItems} imagen${state.totalItems === 1 ? "" : "es"} encontrada${state.totalItems === 1 ? "" : "s"}`;
  });
}

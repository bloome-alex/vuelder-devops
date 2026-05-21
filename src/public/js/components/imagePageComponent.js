import { createEmptyStateComponent } from "./emptyStateComponent.js";
import { createImageTableComponent } from "./imageTableComponent.js";
import { createPaginationComponent } from "./paginationComponent.js";
import { createSearchComponent } from "./searchComponent.js";

export function renderImagePage(container, imageProvider) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Imágenes</h2>
        <p>Listado de imágenes Docker disponibles en el entorno.</p>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar"></div>
    </div>
  `;

  const panel = container.querySelector(".panel");
  const toolbar = container.querySelector(".toolbar");
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

  imageProvider.subscribe(state => {
    imageTable.render(state.pageItems);
    emptyState.render(state.totalItems);
    pagination.render(state);
    summary.textContent = `${state.totalItems} imagen${state.totalItems === 1 ? "" : "es"} encontrada${state.totalItems === 1 ? "" : "s"}`;
  });
}

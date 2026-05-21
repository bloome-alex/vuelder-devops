export function createPaginationComponent({ onPrevious, onNext, onPage }) {
  const element = document.createElement("div");
  element.className = "pagination";
  element.innerHTML = `
    <div class="pagination-info"></div>
    <div class="pagination-actions">
      <button type="button">‹</button>
      <div class="pagination-actions"></div>
      <button type="button">›</button>
    </div>
  `;

  const paginationInfo = element.querySelector(".pagination-info");
  const previousButton = element.querySelector("button:first-of-type");
  const nextButton = element.querySelector("button:last-of-type");
  const pageButtons = element.querySelector(".pagination-actions .pagination-actions");

  previousButton.addEventListener("click", onPrevious);
  nextButton.addEventListener("click", onNext);

  return {
    element,
    render(state) {
      paginationInfo.textContent = `Mostrando ${state.visibleStart}-${state.visibleEnd} de ${state.totalItems}`;
      previousButton.disabled = state.currentPage === 1;
      nextButton.disabled = state.currentPage === state.totalPages;
      pageButtons.innerHTML = "";

      for (let page = 1; page <= state.totalPages; page++) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = page;
        button.className = page === state.currentPage ? "active" : "";
        button.addEventListener("click", () => onPage(page));
        pageButtons.appendChild(button);
      }
    }
  };
}

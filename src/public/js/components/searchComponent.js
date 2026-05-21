export function createSearchComponent({ onSearch }) {
  const wrapper = document.createElement("div");
  wrapper.className = "search";
  wrapper.innerHTML = `
    <span>⌕</span>
    <input type="search" placeholder="Buscar por nombre, tag o repositorio..." />
  `;

  const input = wrapper.querySelector("input");
  input.addEventListener("input", event => onSearch(event.target.value));

  return wrapper;
}

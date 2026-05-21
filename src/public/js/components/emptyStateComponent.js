export function createEmptyStateComponent(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;

  return {
    element,
    render(totalItems) {
      element.style.display = totalItems ? "none" : "block";
    }
  };
}

export function createEmptyStateComponent(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;

  return {
    element,
    render(totalItems, message = null) {
      if (message) {
        element.textContent = message;
      }

      element.style.display = totalItems ? "none" : "block";
    }
  };
}

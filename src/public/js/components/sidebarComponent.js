const navigationItems = [
  { label: "Imágenes", icon: "▦", active: true }
];

export function renderSidebar(container) {
  container.innerHTML = `
    <div class="brand">
      <div class="brand-icon">D</div>
      <div class="brand-text">DevOps</div>
    </div>

    <div class="nav-title">Principal</div>
    ${navigationItems.map(item => `
      <a class="nav-link${item.active ? " active" : ""}" href="#">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    `).join("")}
  `;
}

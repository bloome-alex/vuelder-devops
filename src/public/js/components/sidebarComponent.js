const navigationItems = [
  { label: "Imágenes", icon: "▦", route: "images" },
  { label: "Plantillas", icon: "▣", route: "templates" },
  { label: "Services", icon: "▤", route: "services" },
  { label: "Despliegue", icon: "◈", route: "deploy" },
  { label: "Nginx", icon: "◇", route: "nginx" }
];

export function renderSidebar(container, activeRoute = "images") {
  container.innerHTML = `
    <div class="brand">
      <div class="brand-icon">D</div>
      <div class="brand-text">DevOps</div>
    </div>

    <div class="nav-title">Principal</div>
    ${navigationItems.map(item => `
      <a class="nav-link${item.route === activeRoute ? " active" : ""}" href="#${item.route}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    `).join("")}
  `;
}

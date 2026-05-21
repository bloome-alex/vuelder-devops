import { renderAppBar } from "./components/appBarComponent.js";
import { renderImagePage } from "./components/imagePageComponent.js";
import { renderServicePage } from "./components/servicePageComponent.js";
import { renderSidebar } from "./components/sidebarComponent.js";
import { renderTemplatePage } from "./components/templatePageComponent.js";
import { createImageProvider } from "./providers/imageProvider.js";
import { getImages, syncImages } from "./services/imageService.js";
import { createService, deleteService, deployService, getServices, updateService } from "./services/serviceService.js";
import { createTemplate, deleteTemplate, getTemplates, updateTemplate } from "./services/templateService.js";

const content = document.querySelector(".content");
const imageService = { getImages, syncImages };
const templateService = { getTemplates, createTemplate, updateTemplate, deleteTemplate };
const serviceService = { getServices, createService, updateService, deleteService, deployService };

renderAppBar(document.querySelector(".appbar"));

function getRoute() {
  return window.location.hash.replace("#", "") || "images";
}

function renderRoute() {
  const route = getRoute();
  renderSidebar(document.querySelector(".sidebar"), route);
  content.replaceChildren();

  if (route === "templates") {
    renderTemplatePage(content, { templateService, imageService });
    return;
  }

  if (route === "services") {
    renderServicePage(content, { serviceService, templateService, imageService });
    return;
  }

  const imageProvider = createImageProvider({ imageService, rowsPerPage: 6 });
  renderImagePage(content, imageProvider);
}

window.addEventListener("hashchange", renderRoute);
renderRoute();

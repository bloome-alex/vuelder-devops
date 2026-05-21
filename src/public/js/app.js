import { renderAppBar } from "./components/appBarComponent.js";
import { renderImagePage } from "./components/imagePageComponent.js";
import { renderSidebar } from "./components/sidebarComponent.js";
import { renderTemplatePage } from "./components/templatePageComponent.js";
import { createImageProvider } from "./providers/imageProvider.js";
import { getImages } from "./services/imageService.js";
import { createTemplate, deleteTemplate, getTemplates, updateTemplate } from "./services/templateService.js";

const content = document.querySelector(".content");
const imageService = { getImages };
const templateService = { getTemplates, createTemplate, updateTemplate, deleteTemplate };

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

  const imageProvider = createImageProvider({ imageService, rowsPerPage: 6 });
  renderImagePage(content, imageProvider);
}

window.addEventListener("hashchange", renderRoute);
renderRoute();

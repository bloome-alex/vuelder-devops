import { renderAppBar } from "./components/appBarComponent.js";
import { renderImagePage } from "./components/imagePageComponent.js";
import { renderServicePage } from "./components/servicePageComponent.js";
import { renderSidebar } from "./components/sidebarComponent.js";
import { renderTemplatePage } from "./components/templatePageComponent.js";
import { renderDeployPage } from "./components/deployPageComponent.js";
import { createImageProvider } from "./providers/imageProvider.js";
import { createDeployProvider } from "./providers/deployProvider.js";
import { getImages, syncImages } from "./services/imageService.js";
import { createService, deleteService, deployService, getServices, updateService } from "./services/serviceService.js";
import { createTemplate, deleteTemplate, getTemplates, updateTemplate } from "./services/templateService.js";
import { getServices as getDeployServices, getTasks, restartTask, removeTask, inspectTask, restartService as restartDeployService, deleteService as deleteDeployService, undeployService, inspectService } from "./services/deployService.js";

const content = document.querySelector(".content");
const imageService = { getImages, syncImages };
const templateService = { getTemplates, createTemplate, updateTemplate, deleteTemplate };
const serviceService = { getServices, createService, updateService, deleteService, deployService };
const deployService2 = { getServices: getDeployServices, getTasks, restartTask, removeTask, inspectTask, restartService: restartDeployService, deleteService: deleteDeployService, undeployService, inspectService };

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

  if (route === "deploy") {
    const provider = createDeployProvider({ deployService: deployService2, rowsPerPage: 10 });
    renderDeployPage(content, provider);
    return;
  }

  const imageProvider = createImageProvider({ imageService, rowsPerPage: 6 });
  renderImagePage(content, imageProvider);
}

window.addEventListener("hashchange", renderRoute);
renderRoute();

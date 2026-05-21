import { renderAppBar } from "./components/appBarComponent.js";
import { renderImagePage } from "./components/imagePageComponent.js";
import { renderSidebar } from "./components/sidebarComponent.js";
import { createImageProvider } from "./providers/imageProvider.js";
import { getImages } from "./services/imageService.js";

const imageProvider = createImageProvider({
  imageService: { getImages },
  rowsPerPage: 6
});

renderSidebar(document.querySelector(".sidebar"));
renderAppBar(document.querySelector(".appbar"));
renderImagePage(document.querySelector(".content"), imageProvider);

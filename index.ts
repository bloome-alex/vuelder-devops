import 'dotenv/config';
import { Server } from './src/server/Server';
import { DatabaseConnection } from './src/database/DatabaseConnection';
import { RouterMerger } from './src/utils/RouterMerger';
import { ImagesController } from './src/modules/images/controllers/ImagesController';
import { ImagesService } from './src/modules/images/services/ImagesService';
import { ImagesRoute } from './src/modules/images/routes/ImagesRoute';
import { TemplatesController } from './src/modules/templates/controllers/TemplatesController';
import { TemplatesService } from './src/modules/templates/services/TemplatesService';
import { TemplatesRoute } from './src/modules/templates/routes/TemplatesRoute';
import { Logger } from './src/utils/Logger';

const app = new Server();
const db = DatabaseConnection.getInstance();
const routes = new RouterMerger();
const imagesService = new ImagesService();
const imagesController = new ImagesController().inject('imagesService', imagesService);
const imagesRoute = new ImagesRoute().inject('imagesController', imagesController);
const templatesService = new TemplatesService().inject('imagesService', imagesService);
const templatesController = new TemplatesController().inject('templatesService', templatesService);
const templatesRoute = new TemplatesRoute().inject('templatesController', templatesController);

//Añadir rutas
routes.add(imagesRoute);
routes.add(templatesRoute);

app.inject('db', db);
app.setRoutes(routes);

app.start(Number(process.env.PORT) || 3000).catch((error) => {
  Logger.error('Server failed to start', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

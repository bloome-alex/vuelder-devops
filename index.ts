import 'dotenv/config';
import { Server } from './src/server/Server';
import { DatabaseConnection } from './src/database/DatabaseConnection';
import { RouterMerger } from './src/utils/RouterMerger';
import { ImagesController } from './src/modules/images/controllers/ImagesController';
import { ImagesService } from './src/modules/images/services/ImagesService';
import { ImagesRoute } from './src/modules/images/routes/ImagesRoute';

const app = new Server();
const db = DatabaseConnection.getInstance();
const routes = new RouterMerger();
const imagesService = new ImagesService();
const imagesController = new ImagesController().inject('imagesService', imagesService);
const imagesRoute = new ImagesRoute().inject('imagesController', imagesController);

//Añadir rutas
routes.add(imagesRoute);

app.inject('db', db);
app.setRoutes(routes);

app.start(Number(process.env.PORT) || 3000);

import 'dotenv/config';
import { Server } from './src/server/Server';
import { DatabaseConnection } from './src/database/DatabaseConnection';
import { RouterMerger } from './src/utils/RouterMerger';

const app = new Server();
const db = DatabaseConnection.getInstance();
const routes = new RouterMerger();

//Añadir rutas

app.inject('db', db);
app.setRoutes(routes);

app.start(Number(process.env.PORT) || 3000);
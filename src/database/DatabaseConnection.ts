import mongoose, { Connection } from 'mongoose';
import { IDatabaseConnection } from '../interfaces';
import { Logger } from '../utils/Logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class DatabaseConnection implements IDatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private connection: Connection;

  private constructor() {
    this.connection = mongoose.connection;
  }

  public static getInstance(): DatabaseConnection {
    if (DatabaseConnection.instance === null) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const dbName = process.env.MONGODB_NAME;
    if (!dbName) {
      throw new Error('MONGODB_NAME environment variable is not defined');
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        Logger.info(`Connecting to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);
        await mongoose.connect(uri, { dbName });
        Logger.info('MongoDB connected successfully');
        return;
      } catch (error) {
        Logger.error(`Connection attempt ${attempt} failed: ${error}`);
        if (attempt === MAX_RETRIES) {
          throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
        }
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        Logger.info(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      Logger.info('MongoDB disconnected successfully');
    } catch (error) {
      Logger.error(`Error disconnecting from MongoDB: ${error}`);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  public getConnection(): Connection {
    return this.connection;
  }
}

import { Connection } from 'mongoose';
import { Router } from 'express';

export interface IDatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnection(): Connection;
}

export interface IRoutes {
  getRoutes(): Router;
  add(route: IRoutes): void;
  registerRoutes(routes: IRoutes[]): void;
}

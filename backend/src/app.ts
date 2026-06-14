import express from 'express';
import './types/express-augment';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { json } from 'body-parser';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.use(json());

  app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

  // API routes
  app.use('/api', routes);

  // Global error handler
  app.use(errorHandler);

  return app;
}

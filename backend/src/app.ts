import cors from 'cors';
import express from 'express';
import type { Container } from './container';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error';
import { createRoutes } from './routes';

export function createApp(container: Container): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: container.config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger());
  app.use(createRoutes(container));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

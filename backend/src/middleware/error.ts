import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { DomainError } from '../domain/errors/DomainError';
import { NotFoundError } from '../domain/errors/ApplicationErrors';

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route'));
}

interface ErrorWithDetails extends Error {
  details?: unknown;
  type?: string;
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof DomainError) {
    const details = (error as ErrorWithDetails).details;
    const body: Record<string, unknown> = { error: error.message, code: error.code };
    if (details !== undefined) {
      body.details = details;
    }
    res.status(error.statusCode).json(body);
    return;
  }

  const candidate = error as ErrorWithDetails;
  if (candidate?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body', code: 'VALIDATION_ERROR' });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Malformed request', code: 'VALIDATION_ERROR' });
    return;
  }

  console.error('[error]', error);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}

export function requestLogger(): RequestHandler {
  return (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  };
}

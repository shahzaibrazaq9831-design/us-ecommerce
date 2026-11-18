import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../domain/errors/ApplicationErrors';

type ValidationSource = 'body' | 'query' | 'params';

export function validate(schema: ZodType, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new ValidationError('Request validation failed', result.error.flatten()));
      return;
    }
    // Express request properties are typed broadly; assignment is safe here.
    req[source] = result.data as never;
    next();
  };
}

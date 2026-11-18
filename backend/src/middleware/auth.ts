import type { NextFunction, Request, Response } from 'express';
import { AuthenticationError, AuthorizationError } from '../domain/errors/ApplicationErrors';
import type { Role } from '../domain/types';
import type { AuthService } from '../services/AuthService';

export interface AuthMiddleware {
  authenticate(req: Request, res: Response, next: NextFunction): void;
  requireRole(role: Role): (req: Request, res: Response, next: NextFunction) => void;
}

export function createAuthMiddleware(auth: AuthService): AuthMiddleware {
  const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        throw new AuthenticationError('Bearer token required');
      }
      const token = header.slice('Bearer '.length).trim();
      const payload = auth.verifyToken(token);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
      next();
    } catch (error) {
      next(error);
    }
  };

  return {
    authenticate,
    requireRole: (role: Role) => (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        next(new AuthenticationError());
        return;
      }
      if (req.user.role !== role) {
        next(new AuthorizationError());
        return;
      }
      next();
    },
  };
}

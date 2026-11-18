import { DomainError } from './DomainError';

export class ValidationError extends DomainError {
  public constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
    if (details !== undefined) {
      Object.defineProperty(this, 'details', {
        value: details,
        enumerable: true,
        writable: false,
      });
    }
  }
}

export class AuthenticationError extends DomainError {
  public constructor(message = 'Invalid email or password') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends DomainError {
  public constructor(message = 'You do not have permission to perform this action') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends DomainError {
  public constructor(entity: string) {
    super(`${entity} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends DomainError {
  public constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(message: string, code = 'DOMAIN_ERROR', statusCode = 422) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

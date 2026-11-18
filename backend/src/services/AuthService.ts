import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../domain/Admin';
import { Customer } from '../domain/Customer';
import { RegularTier } from '../domain/customer/RegularTier';
import { AuthenticationError, ConflictError, NotFoundError } from '../domain/errors/ApplicationErrors';
import type { Role } from '../domain/types';
import type { UserRepository } from '../repositories/UserRepository';

export interface JwtPayload {
  sub: string;
  role: Role;
  email: string;
}

export interface AuthResult {
  token: string;
  user: Record<string, unknown>;
}

export class AuthService {
  public constructor(
    private readonly users: UserRepository,
    private readonly jwtSecret: string,
  ) {}

  public async register(email: string, password: string, name?: string): Promise<AuthResult> {
    if (this.users.emailExists(email)) {
      throw new ConflictError('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = new Customer(randomUUID(), email, passwordHash, new RegularTier(), 0, 200);
    this.users.create(customer);
    return this.buildAuthResult(customer);
  }

  public async login(email: string, password: string): Promise<AuthResult> {
    const user = this.users.findByEmail(email);
    if (!user) {
      throw new AuthenticationError();
    }
    const matches = await bcrypt.compare(password, user.getPasswordHash());
    if (!matches) {
      throw new AuthenticationError();
    }
    return this.buildAuthResult(user);
  }

  public verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return { sub: decoded.sub, role: decoded.role, email: decoded.email };
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  public getUserById(id: string): Admin | Customer {
    const user = this.users.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  public isAdmin(id: string): boolean {
    return this.getUserById(id) instanceof Admin;
  }

  private buildAuthResult(user: Admin | Customer): AuthResult {
    const payload: JwtPayload = {
      sub: user.getId(),
      role: user.getRole(),
      email: user.getEmail(),
    };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
    return {
      token,
      user: user instanceof Customer ? user.toJSON() : user.toJSON(),
    };
  }
}

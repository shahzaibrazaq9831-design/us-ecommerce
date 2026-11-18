import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { AuthService } from '../services/AuthService';

export class AuthController {
  public constructor(private readonly auth: AuthService) {}

  public register = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.auth.register(req.body.email, req.body.password, req.body.displayName);
    res.status(201).json(result);
  });

  public login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.auth.login(req.body.email, req.body.password);
    res.json(result);
  });

  public me = asyncHandler(async (req: Request, res: Response) => {
    const user = this.auth.getUserById(req.user!.id);
    res.json({ user: user.toJSON() });
  });
}

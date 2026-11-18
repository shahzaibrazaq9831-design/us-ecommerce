import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { DiscountService } from '../services/DiscountService';
import { makeDiscount } from './factories';

export class DiscountController {
  public constructor(private readonly discounts: DiscountService) {}

  public list = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ discounts: this.discounts.list() });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    res.json({ discount: this.discounts.get(req.params.id) });
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const discount = makeDiscount(randomUUID(), req.body);
    res.status(201).json({ discount: this.discounts.create(discount) });
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    res.json({ discount: this.discounts.update(req.params.id, req.body) });
  });

  public remove = asyncHandler(async (req: Request, res: Response) => {
    this.discounts.delete(req.params.id);
    res.status(204).send();
  });
}

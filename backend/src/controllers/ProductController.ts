import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { ProductService } from '../services/ProductService';
import { makeProduct } from './factories';

export class ProductController {
  public constructor(private readonly products: ProductService) {}

  public list = asyncHandler(async (req: Request, res: Response) => {
    const category = this.queryString(req.query.category);
    const search = this.queryString(req.query.search);
    res.json({ products: this.products.list({ category, search }) });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    res.json({ product: this.products.get(req.params.id) });
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const product = makeProduct(randomUUID(), req.body);
    res.status(201).json({ product: this.products.create(product) });
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    res.json({ product: this.products.update(req.params.id, req.body) });
  });

  public remove = asyncHandler(async (req: Request, res: Response) => {
    this.products.delete(req.params.id);
    res.status(204).send();
  });

  public setStock = asyncHandler(async (req: Request, res: Response) => {
    res.json({ product: this.products.setStock(req.params.id, req.body.stock) });
  });

  private queryString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }
}

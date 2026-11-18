import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { CartService } from '../services/CartService';
import { makeDelivery } from './factories';

export class CartController {
  public constructor(private readonly cart: CartService) {}

  public get = asyncHandler(async (req: Request, res: Response) => {
    res.json({ cart: this.cart.getCart(req.user!.id) });
  });

  public addItem = asyncHandler(async (req: Request, res: Response) => {
    res.json({ cart: this.cart.addItem(req.user!.id, req.body.productId, req.body.quantity) });
  });

  public updateItem = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      cart: this.cart.updateItem(req.user!.id, req.params.productId, req.body.quantity),
    });
  });

  public removeItem = asyncHandler(async (req: Request, res: Response) => {
    res.json({ cart: this.cart.removeItem(req.user!.id, req.params.productId) });
  });

  public applyPromo = asyncHandler(async (req: Request, res: Response) => {
    res.json({ cart: this.cart.applyPromo(req.user!.id, req.body.code) });
  });

  public applyDelivery = asyncHandler(async (req: Request, res: Response) => {
    res.json({ cart: this.cart.applyDelivery(req.user!.id, makeDelivery(req.body.code)) });
  });
}

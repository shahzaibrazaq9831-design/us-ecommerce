import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { OrderService } from '../services/OrderService';
import { makeDelivery, makePayment } from './factories';

export class OrderController {
  public constructor(private readonly orders: OrderService) {}

  public checkout = asyncHandler(async (req: Request, res: Response) => {
    const delivery = makeDelivery(req.body.deliveryMethod);
    res.status(201).json({ order: this.orders.createFromCart(req.user!.id, delivery) });
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    res.json({ orders: this.orders.listForCustomer(req.user!.id) });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.get(req.user!.id, req.params.id) });
  });

  public updateItem = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      order: this.orders.updateItem(req.user!.id, req.params.id, req.body.productId, req.body.quantity),
    });
  });

  public confirm = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.confirm(req.user!.id, req.params.id) });
  });

  public pay = asyncHandler(async (req: Request, res: Response) => {
    const payment = makePayment(req.body);
    res.json({ order: this.orders.pay(req.user!.id, req.params.id, payment) });
  });

  public cancel = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.cancel(req.user!.id, req.params.id) });
  });

  public invoice = asyncHandler(async (req: Request, res: Response) => {
    res.json({ invoice: this.orders.getInvoice(req.user!.id, req.params.id) });
  });

  public topUp = asyncHandler(async (req: Request, res: Response) => {
    res.json({ customer: this.orders.topUpWallet(req.user!.id, req.body.amount) });
  });
}

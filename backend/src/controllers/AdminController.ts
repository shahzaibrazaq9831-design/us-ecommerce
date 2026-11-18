import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { AdminService } from '../services/AdminService';
import type { OrderService } from '../services/OrderService';

export class AdminController {
  public constructor(
    private readonly admin: AdminService,
    private readonly orders: OrderService,
  ) {}

  public stats = asyncHandler(async (_req: Request, res: Response) => {
    res.json(this.admin.getStats());
  });

  public listOrders = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ orders: this.admin.listOrders() });
  });

  public listCustomers = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ customers: this.admin.listCustomers() });
  });

  public process = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.process(req.params.id) });
  });

  public ship = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.ship(req.params.id, req.body?.trackingNumber) });
  });

  public deliver = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.deliver(req.params.id) });
  });

  public refund = asyncHandler(async (req: Request, res: Response) => {
    res.json({ order: this.orders.refund(req.params.id) });
  });
}

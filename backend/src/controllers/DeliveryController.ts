import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import type { DeliveryCode } from '../domain/types';
import { makeDelivery } from './factories';

const DELIVERY_CODES: readonly DeliveryCode[] = ['standard', 'express', 'same_day'];

export class DeliveryController {
  public list = asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      deliveryMethods: DELIVERY_CODES.map((code) => {
        const method = makeDelivery(code);
        return {
          ...method.getSnapshot(),
          estimatedArrival: method.estimateDeliveryTime().toISOString(),
        };
      }),
    });
  });
}

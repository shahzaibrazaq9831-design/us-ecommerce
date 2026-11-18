import { z } from 'zod';

const productBase = {
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
};

const dimensionsSchema = z.object({
  length: z.number().nonnegative(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  unit: z.string().min(1).default('cm'),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productCreateSchema = z.discriminatedUnion('type', [
  z.object({
    ...productBase,
    type: z.literal('physical'),
    stock: z.number().int().nonnegative(),
    weight: z.number().nonnegative(),
    dimensions: dimensionsSchema,
  }),
  z.object({
    ...productBase,
    type: z.literal('digital'),
    downloadLink: z.string().url(),
  }),
  z.object({
    ...productBase,
    type: z.literal('subscription'),
    durationMonths: z.number().int().positive(),
    autoRenew: z.boolean(),
  }),
]);

export const productUpdateSchema = z.object({
  ...productBase,
  stock: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  dimensions: dimensionsSchema.optional(),
  downloadLink: z.string().url().optional(),
  durationMonths: z.number().int().positive().optional(),
  autoRenew: z.boolean().optional(),
});

export const stockPatchSchema = z.object({
  stock: z.number().int().nonnegative(),
});

export const discountCreateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('percentage'),
    code: z.string().min(1),
    description: z.string().min(1),
    percentage: z.number().min(0).max(100),
  }),
  z.object({
    type: z.literal('fixed_amount'),
    code: z.string().min(1),
    description: z.string().min(1),
    amount: z.number().nonnegative(),
  }),
  z.object({
    type: z.literal('buy_one_get_one'),
    code: z.string().min(1),
    description: z.string().min(1),
  }),
  z.object({
    type: z.literal('seasonal'),
    code: z.string().min(1),
    description: z.string().min(1),
    percentage: z.number().min(0).max(100),
    activeFrom: z.string().datetime().optional(),
    activeTo: z.string().datetime().optional(),
  }),
]);

export const discountUpdateSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().nonnegative().optional(),
  activeFrom: z.string().datetime().nullable().optional(),
  activeTo: z.string().datetime().nullable().optional(),
});

export const deliverySelectionSchema = z.object({
  deliveryMethod: z.enum(['standard', 'express', 'same_day']),
});

export const deliveryCodeSchema = z.object({
  code: z.enum(['standard', 'express', 'same_day']),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const cartQuantitySchema = z.object({
  quantity: z.number().int().positive(),
});

export const promoSchema = z.object({
  code: z.string().min(1),
});

export const paymentSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('credit_card'), last4: z.string().regex(/^\d{4}$/) }),
  z.object({ method: z.literal('bank_transfer'), bankName: z.string().min(1), accountLast4: z.string().regex(/^\d{4}$/) }),
  z.object({ method: z.literal('digital_wallet'), provider: z.string().min(1) }),
]);

export const walletTopUpSchema = z.object({
  amount: z.number().positive(),
});

export const trackingSchema = z.object({
  trackingNumber: z.string().min(1).optional(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });
export const productIdParamSchema = z.object({ productId: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type DiscountCreateInput = z.infer<typeof discountCreateSchema>;
export type DiscountUpdateInput = z.infer<typeof discountUpdateSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type DeliverySelectionInput = z.infer<typeof deliverySelectionSchema>;

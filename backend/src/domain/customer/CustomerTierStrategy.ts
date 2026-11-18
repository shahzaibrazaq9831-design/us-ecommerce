import type { CustomerTier } from '../types';

export interface CustomerTierStrategy {
  getTier(): CustomerTier;
  calculateDiscount(subtotal: number): number;
  qualifiesForFreeShipping(subtotal: number, threshold: number): boolean;
  getDescription(): string;
}

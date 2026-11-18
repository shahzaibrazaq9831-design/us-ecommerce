import { PricingCalculator } from './PricingCalculator';
import { DiscountCalculator } from './DiscountCalculator';
import { ShippingCalculator } from './ShippingCalculator';
import { SubtotalCalculator } from './SubtotalCalculator';
import { TaxCalculator } from './TaxCalculator';

export function createPricingCalculator(): PricingCalculator {
  return new PricingCalculator(
    new SubtotalCalculator(),
    new ShippingCalculator(),
    new TaxCalculator(),
    new DiscountCalculator(),
  );
}

import bcrypt from 'bcryptjs';
import { loadConfig } from './config';
import { createContainer, type Container } from './container';
import { Admin } from './domain/Admin';
import { Customer } from './domain/Customer';
import { BusinessTier } from './domain/customer/BusinessTier';
import { PremiumTier } from './domain/customer/PremiumTier';
import { RegularTier } from './domain/customer/RegularTier';
import { BuyOneGetOneDiscount } from './domain/discounts/BuyOneGetOneDiscount';
import { FixedAmountDiscount } from './domain/discounts/FixedAmountDiscount';
import { PercentageDiscount } from './domain/discounts/PercentageDiscount';
import { SeasonalDiscount } from './domain/discounts/SeasonalDiscount';
import { DigitalProduct } from './domain/products/DigitalProduct';
import { PhysicalProduct } from './domain/products/PhysicalProduct';
import { SubscriptionProduct } from './domain/products/SubscriptionProduct';

export const SEED_CREDENTIALS = {
  admin: { email: 'admin@example.com', password: 'Admin123!' },
  customers: [
    { email: 'regular@example.com', password: 'Customer123!', tier: 'REGULAR' },
    { email: 'premium@example.com', password: 'Customer123!', tier: 'PREMIUM' },
    { email: 'business@example.com', password: 'Customer123!', tier: 'BUSINESS' },
  ],
} as const;

export async function seedDatabase(container: Container): Promise<void> {
  const { repositories } = container;
  const adminPasswordHash = await bcrypt.hash(SEED_CREDENTIALS.admin.password, 10);
  const customerPasswordHash = await bcrypt.hash(SEED_CREDENTIALS.customers[0].password, 10);

  if (!repositories.users.findByEmail(SEED_CREDENTIALS.admin.email)) {
    repositories.users.create(new Admin('seed-admin', SEED_CREDENTIALS.admin.email, adminPasswordHash));
  }

  const tierEntries = [
    { id: 'seed-customer-regular', email: SEED_CREDENTIALS.customers[0].email, strategy: new RegularTier(), balance: 100, threshold: 200 },
    { id: 'seed-customer-premium', email: SEED_CREDENTIALS.customers[1].email, strategy: new PremiumTier(), balance: 250, threshold: 200 },
    { id: 'seed-customer-business', email: SEED_CREDENTIALS.customers[2].email, strategy: new BusinessTier(), balance: 500, threshold: 150 },
  ] as const;

  for (const entry of tierEntries) {
    if (!repositories.users.findByEmail(entry.email)) {
      repositories.users.create(
        new Customer(entry.id, entry.email, customerPasswordHash, entry.strategy, entry.balance, entry.threshold),
      );
    }
  }

  if (repositories.products.count() === 0) {
    repositories.products.create(
      new PhysicalProduct(
        'seed-product-dress',
        'Elegant Summer Dress',
        'Lightweight floral dress for warm days',
        'apparel',
        'DRS-1001',
        79.99,
        25,
        0.6,
        { length: 30, width: 22, height: 4, unit: 'cm' },
      ),
    );
    repositories.products.create(
      new PhysicalProduct(
        'seed-product-jacket',
        'Raincoat',
        'Water-resistant timeless raincoat',
        'outerwear',
        'DRS-1002',
        149.5,
        3,
        1.2,
        { length: 40, width: 30, height: 8, unit: 'cm' },
      ),
    );
    repositories.products.create(
      new DigitalProduct(
        'seed-product-pattern',
        'Sewing Pattern Pack',
        'Downloadable dress patterns in four sizes',
        'digital',
        'DIG-2001',
        19.99,
        'https://example.com/downloads/sewing-patterns.zip',
      ),
    );
    repositories.products.create(
      new SubscriptionProduct(
        'seed-product-style-box',
        'Monthly Style Box',
        'Curated accessories delivered every month',
        'subscription',
        'SUB-3001',
        29.99,
        3,
        true,
      ),
    );
  }

  if (repositories.discounts.count() === 0) {
    repositories.discounts.create(
      new PercentageDiscount('seed-discount-percent', 'SAVE10', '10% off your order', 10),
    );
    repositories.discounts.create(
      new FixedAmountDiscount('seed-discount-fixed', 'TAKE20', '$20 off your order', 20),
    );
    repositories.discounts.create(
      new BuyOneGetOneDiscount('seed-discount-bogo', 'BOGO', 'Buy one, get one free'),
    );
    repositories.discounts.create(
      new SeasonalDiscount('seed-discount-seasonal', 'SUMMER15', 'Seasonal 15% discount', 15),
    );
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const container = createContainer(config);
  if (process.argv.includes('--reset')) {
    container.db.reset();
  }
  await seedDatabase(container);
  console.log('Seed complete.');
  console.log('Admin:', SEED_CREDENTIALS.admin);
  console.log('Customers:', SEED_CREDENTIALS.customers);
  container.db.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

import { DigitalProduct } from '../domain/products/DigitalProduct';
import { PhysicalProduct } from '../domain/products/PhysicalProduct';
import { SubscriptionProduct } from '../domain/products/SubscriptionProduct';
import type { Product } from '../domain/Product';
import type { AppDatabase } from './AppDatabase';
import { productFactories } from './mappers';
import type { ProductRow } from './rows';

export interface ProductFilter {
  category?: string;
  search?: string;
}

export class ProductRepository {
  public constructor(private readonly db: AppDatabase) {}

  public create(product: Product): Product {
    const values = this.toRowValues(product);
    this.db.raw
      .prepare(
        `INSERT INTO products
          (id, type, name, description, category, sku, price, stock, weight, dimensions,
           download_link, duration_months, auto_renew, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        product.getId(),
        product.getType(),
        values.name,
        values.description,
        values.category,
        values.sku,
        values.price,
        values.stock,
        values.weight,
        values.dimensions,
        values.downloadLink,
        values.durationMonths,
        values.autoRenew,
        product.getCreatedAt().toISOString(),
      );
    return product;
  }

  public save(product: Product): void {
    const values = this.toRowValues(product);
    this.db.raw
      .prepare(
        `UPDATE products
            SET name = ?, description = ?, category = ?, sku = ?, price = ?,
                stock = ?, weight = ?, dimensions = ?, download_link = ?,
                duration_months = ?, auto_renew = ?
          WHERE id = ?`,
      )
      .run(
        values.name,
        values.description,
        values.category,
        values.sku,
        values.price,
        values.stock,
        values.weight,
        values.dimensions,
        values.downloadLink,
        values.durationMonths,
        values.autoRenew,
        product.getId(),
      );
  }

  public saveAll(products: Iterable<Product>): void {
    for (const product of products) {
      this.save(product);
    }
  }

  public findById(id: string): Product | null {
    const row = this.db.raw.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
    return row ? productFactories[row.type](row) : null;
  }

  public findBySku(sku: string): Product | null {
    const row = this.db.raw.prepare('SELECT * FROM products WHERE sku = ?').get(sku) as ProductRow | undefined;
    return row ? productFactories[row.type](row) : null;
  }

  public list(filter: ProductFilter = {}): Product[] {
    const conditions: string[] = [];
    const params: string[] = [];

    if (filter.category) {
      conditions.push('LOWER(category) = LOWER(?)');
      params.push(filter.category);
    }
    if (filter.search) {
      conditions.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(sku) LIKE ?)');
      const term = `%${filter.search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.db.raw
      .prepare(`SELECT * FROM products ${where} ORDER BY created_at DESC`)
      .all(...params) as ProductRow[];
    return rows.map((row) => productFactories[row.type](row));
  }

  public delete(id: string): boolean {
    const result = this.db.raw.prepare('DELETE FROM products WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public count(): number {
    const result = this.db.raw.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };
    return result.count;
  }

  private toRowValues(product: Product): {
    name: string;
    description: string;
    category: string;
    sku: string;
    price: number;
    stock: number | null;
    weight: number | null;
    dimensions: string | null;
    downloadLink: string | null;
    durationMonths: number | null;
    autoRenew: number | null;
  } {
    return {
      name: product.getName(),
      description: product.getDescription(),
      category: product.getCategory(),
      sku: product.getSku(),
      price: product.getPrice(),
      stock: product instanceof PhysicalProduct ? product.getStock() : null,
      weight: product instanceof PhysicalProduct ? product.getWeight() : null,
      dimensions: product instanceof PhysicalProduct ? JSON.stringify(product.getDimensions()) : null,
      downloadLink: product instanceof DigitalProduct ? product.getDownloadLink() : null,
      durationMonths: product instanceof SubscriptionProduct ? product.getDurationMonths() : null,
      autoRenew: product instanceof SubscriptionProduct ? (product.getAutoRenew() ? 1 : 0) : null,
    };
  }
}

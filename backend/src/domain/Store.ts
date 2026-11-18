import type { Product } from './Product';

/**
 * Aggregate root for the catalog. Products keep their own identity and can be
 * created, edited and deleted independently of the store that lists them.
 */
export class Store {
  private readonly products: Map<string, Product>;

  public constructor(products: Iterable<Product> = []) {
    this.products = new Map([...products].map((product) => [product.getId(), product] as const));
  }

  public addProduct(product: Product): void {
    this.products.set(product.getId(), product);
  }

  public removeProduct(productId: string): void {
    // Aggregation: detaching a product does not destroy it.
    this.products.delete(productId);
  }

  public getProduct(productId: string): Product | undefined {
    return this.products.get(productId);
  }

  public listProducts(): readonly Product[] {
    return [...this.products.values()];
  }

  public getProductCount(): number {
    return this.products.size;
  }
}

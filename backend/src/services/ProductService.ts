import { randomUUID } from 'node:crypto';
import type { Product } from '../domain/Product';
import { ConflictError, NotFoundError } from '../domain/errors/ApplicationErrors';
import { DigitalProduct } from '../domain/products/DigitalProduct';
import { PhysicalProduct } from '../domain/products/PhysicalProduct';
import { SubscriptionProduct } from '../domain/products/SubscriptionProduct';
import type { Dimensions } from '../domain/types';
import type { ProductFilter, ProductRepository } from '../repositories/ProductRepository';

export interface ProductUpdateInput {
  name: string;
  description: string;
  category: string;
  sku: string;
  price: number;
  stock?: number;
  weight?: number;
  dimensions?: Dimensions;
  downloadLink?: string;
  durationMonths?: number;
  autoRenew?: boolean;
}

export class ProductService {
  public constructor(private readonly products: ProductRepository) {}

  public create(product: Product): Record<string, unknown> {
    if (this.products.findBySku(product.getSku())) {
      throw new ConflictError('A product with this SKU already exists');
    }
    this.products.create(product);
    return product.getSnapshot();
  }

  public list(filter: ProductFilter): Record<string, unknown>[] {
    return this.products.list(filter).map((product) => product.getSnapshot());
  }

  public get(id: string): Record<string, unknown> {
    const product = this.products.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product.getSnapshot();
  }

  public update(id: string, input: ProductUpdateInput): Record<string, unknown> {
    const product = this.products.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const duplicate = this.products.findBySku(input.sku);
    if (duplicate && duplicate.getId() !== id) {
      throw new ConflictError('A product with this SKU already exists');
    }

    product.updateDetails(input.name, input.description, input.category, input.sku, input.price);
    this.applyTypeSpecificUpdate(product, input);
    this.products.save(product);
    return product.getSnapshot();
  }

  public setStock(id: string, stock: number): Record<string, unknown> {
    const product = this.products.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    if (!(product instanceof PhysicalProduct)) {
      throw new ConflictError('Stock can only be managed for physical products');
    }
    product.setStock(stock);
    this.products.save(product);
    return product.getSnapshot();
  }

  public delete(id: string): void {
    if (!this.products.delete(id)) {
      throw new NotFoundError('Product');
    }
  }

  private applyTypeSpecificUpdate(product: Product, input: ProductUpdateInput): void {
    if (product instanceof PhysicalProduct) {
      if (input.stock !== undefined) product.setStock(input.stock);
      if (input.weight !== undefined) product.setWeight(input.weight);
      if (input.dimensions !== undefined) product.setDimensions(input.dimensions);
      return;
    }
    if (product instanceof DigitalProduct && input.downloadLink !== undefined) {
      product.setDownloadLink(input.downloadLink);
      return;
    }
    if (product instanceof SubscriptionProduct) {
      if (input.durationMonths !== undefined) product.setDurationMonths(input.durationMonths);
      if (input.autoRenew !== undefined) product.setAutoRenew(input.autoRenew);
    }
  }
}

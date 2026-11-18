import { Product } from '../Product';
import { DomainError } from '../errors/DomainError';
import { roundMoney } from '../money';

export class DigitalProduct extends Product {
  private downloadLink: string;

  public constructor(
    id: string,
    name: string,
    description: string,
    category: string,
    sku: string,
    price: number,
    downloadLink: string,
    createdAt?: Date,
  ) {
    super(id, name, description, category, sku, price, createdAt);
    this.assertLink(downloadLink);
    this.downloadLink = downloadLink;
  }

  public override calculatePrice(quantity: number): number {
    this.assertQuantity(quantity);
    return roundMoney(this.getPrice() * quantity);
  }

  public override getType(): 'digital' {
    return 'digital';
  }

  public override getDetails(): Record<string, unknown> {
    return { downloadLink: this.downloadLink };
  }

  public getDownloadLink(): string {
    return this.downloadLink;
  }

  public setDownloadLink(link: string): void {
    this.assertLink(link);
    this.downloadLink = link;
  }

  private assertLink(link: string): void {
    if (link.trim().length === 0) {
      throw new DomainError('Download link is required for digital products', 'INVALID_DOWNLOAD_LINK');
    }
  }
}

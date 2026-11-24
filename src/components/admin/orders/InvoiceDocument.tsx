import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cleanAddressLines, invoiceBrand } from "@/lib/brand";
import { formatDate, formatMoney } from "@/lib/admin/format";
import {
  isPaymentStatus,
  normaliseStatus,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
  type StoredOrder,
} from "@/lib/orders";
import { stitchingLabels, type StitchingOption } from "@/lib/products";
import InvoicePrintButton from "./InvoicePrintButton";

/** Returns trimmed text, or an empty string when the value is missing. */
function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Turns a raw stitching value into the wording used on the storefront. */
function stitchingText(value: string | undefined): string {
  const raw = clean(value);
  if (!raw) return "";
  return stitchingLabels[raw as StitchingOption] ?? raw;
}

/** Turns a saved status into a readable label, even for older orders. */
function statusLabel(value: string, labels: Record<string, string>): string {
  const raw = clean(value);
  if (!raw) return "Not recorded";
  return labels[raw] ?? raw.replace(/[_-]+/g, " ").replace(/^./, (char) => char.toUpperCase());
}

/** Only keeps image addresses that cannot run scripts in an old browser. */
function safeImageUrl(value: string | undefined): string {
  const url = clean(value);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return "";
}

/** Builds the money rows from the fields the order actually carries. */
function moneyRows(order: StoredOrder, currency: string) {
  const rows: Array<{ label: string; value: string }> = [];
  const totals = order.totals ?? { subtotal: 0, shipping: 0, discount: 0, total: 0 };
  const { subtotal, shipping, discount } = totals;

  if (typeof subtotal === "number" && Number.isFinite(subtotal)) {
    rows.push({ label: "Subtotal", value: formatMoney(subtotal, currency) });
  }
  if (typeof shipping === "number" && Number.isFinite(shipping) && shipping > 0) {
    rows.push({ label: "Delivery", value: formatMoney(shipping, currency) });
  }
  if (typeof discount === "number" && Number.isFinite(discount) && discount > 0) {
    rows.push({ label: "Discount", value: `−${formatMoney(discount, currency)}` });
  }
  return rows;
}

/**
 * The printable invoice. Every customer value is rendered as a React text
 * node, so the browser escapes it. Image addresses are checked separately.
 */
export default function InvoiceDocument({ order }: { order: StoredOrder }) {
  const currency = clean(order.totals?.currency) || "PKR";
  const status = normaliseStatus(order.status);
  const cancelled = status === "cancelled";
  const paymentStatus = clean(order.payment?.status);
  const paymentMethod = clean(order.payment?.method);
  const paid = paymentStatus === "paid";

  const paymentStamp =
    paid ? "PAID" : paymentMethod === "cod" ? "CASH ON DELIVERY" : "UNPAID";

  const billToLines = cleanAddressLines([
    order.address?.line1,
    order.address?.line2,
    cleanAddressLines([order.address?.city, order.address?.state]).join(", "),
    order.address?.postalCode,
    order.address?.country,
  ]);

  const sellerLines = cleanAddressLines(invoiceBrand.address);
  const money = moneyRows(order, currency);
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="invoice-page">
      <div className="invoice-toolbar">
        <Link href="/admin/orders" className="invoice-action invoice-action--ghost">
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </Link>
        <InvoicePrintButton />
      </div>

      <div className="invoice-print-area">
        <article className="invoice-paper">
          <header className="invoice-header">
            <div className="invoice-logo-block">
              <Image
                src={invoiceBrand.logo}
                alt={invoiceBrand.name}
                width={240}
                height={60}
                className="invoice-logo"
              />
              <p className="invoice-tagline">Luxury designer-inspired dresses</p>
            </div>

            <div className="invoice-title-block">
              <h1>INVOICE</h1>
              <dl className="invoice-meta">
                <div>
                  <dt>Invoice number</dt>
                  <dd>{clean(order.id) || "Not recorded"}</dd>
                </div>
                <div>
                  <dt>Order date</dt>
                  <dd>{formatDate(order.date)}</dd>
                </div>
              </dl>
              <div className="invoice-stamps" aria-label="Invoice status">
                <span className={`invoice-stamp invoice-stamp--${paymentStamp.toLowerCase().replace(/\s+/g, "-")}`}>
                  {paymentStamp}
                </span>
                {cancelled ? <span className="invoice-stamp invoice-stamp--cancelled">CANCELLED</span> : null}
              </div>
            </div>
          </header>

          <div className="invoice-rule" aria-hidden="true" />

          <section className="invoice-parties" aria-label="Seller and customer">
            <div className="invoice-party">
              <h2>From</h2>
              <p className="invoice-party-name">{invoiceBrand.name}</p>
              {sellerLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {clean(invoiceBrand.phone) ? <p>{clean(invoiceBrand.phone)}</p> : null}
              {clean(invoiceBrand.email) ? <p>{clean(invoiceBrand.email)}</p> : null}
              {clean(invoiceBrand.website) ? <p>{clean(invoiceBrand.website)}</p> : null}
            </div>

            <div className="invoice-party">
              <h2>Bill to</h2>
              <p className="invoice-party-name">
                {clean(order.customer?.name) || "Guest customer"}
              </p>
              {clean(order.customer?.phone) ? <p>{clean(order.customer?.phone)}</p> : null}
              {clean(order.email || order.customer?.email) ? (
                <p>{clean(order.email || order.customer?.email)}</p>
              ) : null}
              {billToLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>

          <section className="invoice-order-details" aria-label="Order details">
            <h2>Order details</h2>
            <dl className="invoice-detail-grid">
              {paymentMethod ? (
                <div>
                  <dt>Payment method</dt>
                  <dd>{statusLabel(paymentMethod, paymentMethodLabels)}</dd>
                </div>
              ) : null}
              {paymentStatus ? (
                <div>
                  <dt>Payment status</dt>
                  <dd>{isPaymentStatus(paymentStatus) ? paymentStatusLabels[paymentStatus] : statusLabel(paymentStatus, {})}</dd>
                </div>
              ) : null}
              <div>
                <dt>Order status</dt>
                <dd>{orderStatusLabels[status] ?? status}</dd>
              </div>
              {clean(order.id) ? (
                <div>
                  <dt>Order number</dt>
                  <dd>{clean(order.id)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="invoice-items" aria-label="Ordered items">
            <table>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Details</th>
                  <th scope="col" className="invoice-number">Qty</th>
                  <th scope="col" className="invoice-number">Unit price</th>
                  <th scope="col" className="invoice-number">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((item, index) => {
                    const image = safeImageUrl(item.image);
                    const unitPrice = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0;
                    const quantity = typeof item.quantity === "number" && Number.isFinite(item.quantity) ? item.quantity : 0;
                    const details = [
                      stitchingText(item.stitching),
                      clean(item.size) ? `Size ${clean(item.size)}` : "",
                      clean(item.lining),
                    ].filter(Boolean);

                    return (
                      <tr key={`${clean(item.slug) || "item"}-${index}`}>
                        <td>
                          <span className="invoice-item-cell">
                            {image ? (
                              <span className="invoice-thumb">
                                {/* Customer image addresses are checked above. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image} alt="" />
                              </span>
                            ) : null}
                            <strong>{clean(item.name) || clean(item.slug) || "Item"}</strong>
                          </span>
                        </td>
                        <td>{details.length ? details.join(" · ") : "—"}</td>
                        <td className="invoice-number">{quantity}</td>
                        <td className="invoice-number">{formatMoney(unitPrice, currency)}</td>
                        <td className="invoice-number">{formatMoney(unitPrice * quantity, currency)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="invoice-empty-items">No items were saved with this order.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="invoice-totals" aria-label="Order totals">
            <dl>
              {money.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div className="invoice-grand-total">
                <dt>Grand total</dt>
                <dd>{formatMoney(order.totals?.total ?? 0, currency)}</dd>
              </div>
            </dl>
          </section>

          <footer className="invoice-footer">
            <p className="invoice-thank-you">Thank you for shopping with {invoiceBrand.name}.</p>
            <p>{invoiceBrand.returnsLine}</p>
            <p>
              Need help? {clean(invoiceBrand.supportEmail) || invoiceBrand.email}
              {clean(invoiceBrand.website) ? ` · ${clean(invoiceBrand.website)}` : ""}
            </p>
            <p className="invoice-disclaimer">This is a computer generated invoice.</p>
          </footer>
        </article>
      </div>
    </div>
  );
}

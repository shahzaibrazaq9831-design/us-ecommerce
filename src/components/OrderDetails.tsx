"use client";

import Image from "next/image";
import { measurementFields, stitchingLabels, type StitchingOption } from "@/lib/products";
import { useCurrency } from "@/context/CurrencyContext";
import type { PublicOrder } from "@/lib/orders";

/**
 * An order, as the customer sees it.
 *
 * The same view is used on the confirmation page and on the lookup page,
 * so a customer sees the same thing whichever way they arrive — and
 * both pages show it only after the order number *and* the email
 * address have been matched.
 */
export default function OrderDetails({
  order,
  children,
}: {
  order: PublicOrder;
  /** Anything extra to show under the order — a "pay now" button, say. */
  children?: React.ReactNode;
}) {
  const { formatPrice } = useCurrency();

  return (
    <div className="order-details">
      <div className="order-details__head">
        <div>
          <p className="order-details__eyebrow">Order number</p>
          <p className="order-details__number">{order.id}</p>
        </div>
        <div className="order-details__status">
          <span className="order-status">{order.statusLabel}</span>
          <p className="order-details__date">
            Placed {new Date(order.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="order-details__grid">
        <div className="order-details__items">
          <h2 className="order-details__heading">What you ordered</h2>

          <ul className="order-items">
            {order.items.map((item, index) => {
              const stitching = item.stitching as StitchingOption | undefined;

              return (
                <li className="order-item" key={`${item.slug}-${index}`}>
                  {item.image ? (
                    <div className="order-item__image">
                      <Image
                        src={item.image}
                        alt={item.name ?? item.slug}
                        fill
                        sizes="80px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : null}

                  <div className="order-item__body">
                    <p className="order-item__name">
                      {item.name ?? item.slug}
                      <span className="order-item__quantity">× {item.quantity}</span>
                    </p>

                    <ul className="order-item__choices">
                      {stitching && stitchingLabels[stitching] ? (
                        <li>{stitchingLabels[stitching]}</li>
                      ) : null}
                      {item.size ? <li>Size {item.size}</li> : null}
                      {item.lining ? <li>{item.lining}</li> : null}
                    </ul>

                    {item.measurements ? (
                      <p className="order-item__measurements">
                        <span>Measurements</span>
                        {measurementFields.map((field) => (
                          <span key={field.key}>
                            {field.label}: {item.measurements?.[field.key]}{" "}
                            {item.measurements?.unit}
                          </span>
                        ))}
                      </p>
                    ) : null}

                    {item.notes ? (
                      <p className="order-item__notes">Your note: {item.notes}</p>
                    ) : null}
                  </div>

                  <p className="order-item__price">
                    {formatPrice((item.price ?? 0) * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.totals.subtotal)}</dd>
            </div>
            {order.totals.discount > 0 ? (
              <div className="order-totals__discount">
                <dt>Discount</dt>
                <dd>-{formatPrice(order.totals.discount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Delivery</dt>
              <dd>
                {order.totals.shipping > 0
                  ? formatPrice(order.totals.shipping)
                  : "Free"}
              </dd>
            </div>
            <div className="order-totals__total">
              <dt>Total</dt>
              <dd>{formatPrice(order.totals.total)}</dd>
            </div>
          </dl>
        </div>

        <aside className="order-details__side">
          <h2 className="order-details__heading">Delivering to</h2>
          <address className="order-address">
            <span>{order.customer.name}</span>
            <span>{order.customer.email}</span>
            {order.customer.phone ? <span>{order.customer.phone}</span> : null}
            <span>{order.address.line1}</span>
            {order.address.line2 ? <span>{order.address.line2}</span> : null}
            <span>
              {[order.address.city, order.address.state].filter(Boolean).join(", ")}
            </span>
            {order.address.postalCode ? <span>{order.address.postalCode}</span> : null}
            <span>{order.address.country}</span>
          </address>

          {order.deliveryNote ? (
            <>
              <h2 className="order-details__heading">Your note</h2>
              <p className="order-note">{order.deliveryNote}</p>
            </>
          ) : null}

          <h2 className="order-details__heading">Payment</h2>
          <p className="order-payment">
            {order.payment.method === "cod"
              ? "Cash on delivery"
              : "Card payment"}
            {" — "}
            {order.payment.status === "paid" ? "paid" : "not paid yet"}
          </p>

          {order.payment.chargedAmount !== undefined &&
          order.payment.chargedCurrency ? (
            <p className="order-payment__amount">
              Charged{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: order.payment.chargedCurrency,
              }).format(order.payment.chargedAmount)}
            </p>
          ) : null}

          {order.history.length > 0 ? (
            <>
              <h2 className="order-details__heading">Progress</h2>
              <ol className="order-timeline">
                {order.history.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    <span className="order-timeline__when">
                      {new Date(event.at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span>{event.message}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </aside>
      </div>

      {children}
    </div>
  );
}

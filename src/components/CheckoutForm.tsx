"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useHydrated } from "@/hooks/useHydrated";
import { priceCart } from "@/lib/pricing";
import {
  issuesByField,
  validateCheckoutInput,
  type CheckoutInput,
  type PaymentMethodChoice,
} from "@/lib/checkout-validation";

/**
 * The checkout form.
 *
 * A guest checkout: no account, no password, just the details we need to
 * send the parcel and to stitch the pieces.
 *
 * Two things it is careful about:
 *
 *   - The prices on the summary come from the catalogue, the same way
 *     the server works them out, so the customer sees the real number
 *     before they pay. The server works them out again when the order
 *     arrives, and the server's number is the one that counts.
 *   - The page holds its shape while the cart loads. The cart lives in
 *     the browser, so it is not there for the first picture — the
 *     summary keeps its height anyway, so nothing jumps.
 */
export default function CheckoutForm({
  methods,
}: {
  /** The ways this server can take payment. */
  methods: PaymentMethodChoice[];
}) {
  const { cart, discountCode, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  /** True once the browser has taken over from the server. */
  const hydrated = useHydrated();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [deliveryNote, setDeliveryNote] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>(
    methods.includes("card") ? "card" : methods[0] ?? "cod"
  );

  /**
   * The key that makes creating the order safe to repeat.
   *
   * It is made when the cart changes, so pressing "place order" twice
   * sends the same key and the customer gets the same order instead of
   * two.
   */
  const keyRef = useRef("");
  const cartSignature = useMemo(
    () =>
      cart
        .map(
          (item) =>
            `${item.slug}:${item.quantity}:${item.stitching}:${item.size ?? ""}:${
              item.lining ?? ""
            }:${item.measurements ? JSON.stringify(item.measurements) : ""}`
        )
        .join("|"),
    [cart]
  );

  useEffect(() => {
    keyRef.current = "";
  }, [cartSignature]);

  /** The items, in the shape both the catalogue and the server expect. */
  const items = useMemo(
    () =>
      cart.map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
        stitching: item.stitching,
        ...(item.size ? { size: item.size } : {}),
        ...(item.lining ? { lining: item.lining } : {}),
        ...(item.measurements ? { measurements: item.measurements } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    [cart]
  );

  /** The totals, worked out from the catalogue. */
  const priced = useMemo(() => priceCart(items, discountCode), [items, discountCode]);
  const totals = priced.ok ? priced.order : null;

  const setField = useCallback(
    (group: "contact" | "address", field: string, value: string) => {
      if (group === "contact") {
        setContact((current) => ({ ...current, [field]: value }));
      } else {
        setAddress((current) => ({ ...current, [field]: value }));
      }

      setErrors((current) => {
        if (!current[`${group}.${field}`]) return current;
        const next = { ...current };
        delete next[`${group}.${field}`];
        return next;
      });
    },
    []
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrors({});

    if (!keyRef.current) {
      keyRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    const payload: CheckoutInput = {
      contact,
      address: {
        line1: address.line1,
        ...(address.line2 ? { line2: address.line2 } : {}),
        city: address.city,
        ...(address.state ? { state: address.state } : {}),
        ...(address.postalCode ? { postalCode: address.postalCode } : {}),
        country: address.country,
      },
      deliveryNote,
      termsAccepted,
      items,
      discountCode,
      paymentMethod,
      idempotencyKey: keyRef.current,
    };

    // The same rules the server uses, so mistakes are caught before the
    // order is sent.
    const validation = validateCheckoutInput(payload);

    if (!validation.valid) {
      setErrors(issuesByField(validation.issues));
      setMessage("Please check the highlighted fields and try again.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        issues?: { field: string; message: string }[];
        redirect?: string;
      };

      if (!response.ok || !data.ok) {
        setErrors(issuesByField(data.issues ?? []));
        setMessage(data.error ?? "We could not place that order. Please try again.");
        setSubmitting(false);
        return;
      }

      // The order is with us now, so the cart has done its job.
      clearCart();

      if (data.redirect) {
        window.location.assign(data.redirect);
      }
    } catch {
      setMessage("We could not reach the shop. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  /* The cart has not arrived yet. -------------------------------------- */
  if (!hydrated) {
    return (
      <div className="checkout checkout--loading" aria-busy="true" aria-live="polite">
        <div className="checkout__details">
          <div className="checkout__block">
            <div className="checkout__skeleton" />
            <div className="checkout__skeleton" />
            <div className="checkout__skeleton" />
          </div>
        </div>
        <div className="checkout__summary">
          <div className="checkout__skeleton checkout__skeleton--tall" />
        </div>
      </div>
    );
  }

  /* The cart is empty. ------------------------------------------------ */
  if (cart.length === 0) {
    return (
      <div className="checkout checkout--empty">
        <h2>Your cart is empty</h2>
        <p>There is nothing to check out yet — have a look at the collection.</p>
        <Link href="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form className="checkout" onSubmit={handleSubmit} noValidate>
      <div className="checkout__columns">
        <div className="checkout__details">
          {/* Contact ------------------------------------------------ */}
          <section className="checkout__block">
            <h2 className="checkout__block-title">Contact details</h2>

            <div className="field">
              <label className="field__label" htmlFor="checkout-name">
                Full name
              </label>
              <input
                id="checkout-name"
                name="name"
                className="field__input"
                type="text"
                autoComplete="name"
                value={contact.name}
                onChange={(event) => setField("contact", "name", event.target.value)}
              />
              {errors["contact.name"] ? (
                <p className="field__error">{errors["contact.name"]}</p>
              ) : null}
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field__label" htmlFor="checkout-email">
                  Email
                </label>
                <input
                  id="checkout-email"
                  name="email"
                  className="field__input"
                  type="email"
                  autoComplete="email"
                  value={contact.email}
                  onChange={(event) => setField("contact", "email", event.target.value)}
                />
                {errors["contact.email"] ? (
                  <p className="field__error">{errors["contact.email"]}</p>
                ) : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-phone">
                  Phone
                </label>
                <input
                  id="checkout-phone"
                  name="phone"
                  className="field__input"
                  type="tel"
                  autoComplete="tel"
                  value={contact.phone}
                  onChange={(event) => setField("contact", "phone", event.target.value)}
                />
                {errors["contact.phone"] ? (
                  <p className="field__error">{errors["contact.phone"]}</p>
                ) : null}
              </div>
            </div>
          </section>

          {/* Address ------------------------------------------------ */}
          <section className="checkout__block">
            <h2 className="checkout__block-title">Shipping address</h2>

            <div className="field">
              <label className="field__label" htmlFor="checkout-line1">
                Address
              </label>
              <input
                id="checkout-line1"
                name="line1"
                className="field__input"
                type="text"
                autoComplete="address-line1"
                value={address.line1}
                onChange={(event) => setField("address", "line1", event.target.value)}
              />
              {errors["address.line1"] ? (
                <p className="field__error">{errors["address.line1"]}</p>
              ) : null}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="checkout-line2">
                Apartment, suite, etc. <span className="field__optional">optional</span>
              </label>
              <input
                id="checkout-line2"
                name="line2"
                className="field__input"
                type="text"
                autoComplete="address-line2"
                value={address.line2}
                onChange={(event) => setField("address", "line2", event.target.value)}
              />
              {errors["address.line2"] ? (
                <p className="field__error">{errors["address.line2"]}</p>
              ) : null}
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field__label" htmlFor="checkout-city">
                  City
                </label>
                <input
                  id="checkout-city"
                  name="city"
                  className="field__input"
                  type="text"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(event) => setField("address", "city", event.target.value)}
                />
                {errors["address.city"] ? (
                  <p className="field__error">{errors["address.city"]}</p>
                ) : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-state">
                  State / region{" "}
                  <span className="field__optional">optional</span>
                </label>
                <input
                  id="checkout-state"
                  name="state"
                  className="field__input"
                  type="text"
                  autoComplete="address-level1"
                  value={address.state}
                  onChange={(event) => setField("address", "state", event.target.value)}
                />
                {errors["address.state"] ? (
                  <p className="field__error">{errors["address.state"]}</p>
                ) : null}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field__label" htmlFor="checkout-postal">
                  Postal code{" "}
                  <span className="field__optional">optional</span>
                </label>
                <input
                  id="checkout-postal"
                  name="postalCode"
                  className="field__input"
                  type="text"
                  autoComplete="postal-code"
                  value={address.postalCode}
                  onChange={(event) =>
                    setField("address", "postalCode", event.target.value)
                  }
                />
                {errors["address.postalCode"] ? (
                  <p className="field__error">{errors["address.postalCode"]}</p>
                ) : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-country">
                  Country
                </label>
                <input
                  id="checkout-country"
                  name="country"
                  className="field__input"
                  type="text"
                  autoComplete="country-name"
                  value={address.country}
                  onChange={(event) => setField("address", "country", event.target.value)}
                />
                {errors["address.country"] ? (
                  <p className="field__error">{errors["address.country"]}</p>
                ) : null}
              </div>
            </div>
          </section>

          {/* Delivery note ----------------------------------------- */}
          <section className="checkout__block">
            <h2 className="checkout__block-title">Delivery note</h2>
            <p className="checkout__hint">
              Anything we should know — the occasion, the gate code, the day you
              need it.
            </p>

            <div className="field">
              <label className="field__label" htmlFor="checkout-note">
                Note <span className="field__optional">optional</span>
              </label>
              <textarea
                id="checkout-note"
                name="deliveryNote"
                className="field__input field__input--area"
                rows={4}
                maxLength={500}
                value={deliveryNote}
                onChange={(event) => setDeliveryNote(event.target.value)}
              />
              {errors.deliveryNote ? (
                <p className="field__error">{errors.deliveryNote}</p>
              ) : null}
            </div>
          </section>

          {/* Payment ------------------------------------------------ */}
          <section className="checkout__block">
            <h2 className="checkout__block-title">Payment</h2>

            <div className="checkout__options">
              {methods.includes("card") ? (
                <label className="checkout__option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span>
                    <strong>Pay by card</strong>
                    <small>
                      You are taken to our payment page to pay. We never see or
                      store your card details.
                    </small>
                  </span>
                </label>
              ) : null}

              {methods.includes("cod") ? (
                <label className="checkout__option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span>
                    <strong>Cash on delivery</strong>
                    <small>Pay the courier when the parcel arrives.</small>
                  </span>
                </label>
              ) : null}
            </div>

            {errors.paymentMethod ? (
              <p className="field__error">{errors.paymentMethod}</p>
            ) : null}
          </section>

          {/* Terms -------------------------------------------------- */}
          <section className="checkout__block">
            <label className="checkout__terms">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              />
              <span>
                I have read and accept the{" "}
                <Link href="/terms" target="_blank">
                  terms
                </Link>{" "}
                and the{" "}
                <Link href="/returns" target="_blank">
                  returns policy
                </Link>
                .
              </span>
            </label>
            {errors.termsAccepted ? (
              <p className="field__error">{errors.termsAccepted}</p>
            ) : null}
          </section>
        </div>

        {/* The summary ------------------------------------------------ */}
        <aside className="checkout__summary">
          <h2 className="checkout__block-title">Order summary</h2>

          <ul className="checkout__items">
            {cart.map((item) => (
              <li className="checkout__item" key={`${item.slug}-${item.quantity}-${item.size ?? ""}`}>
                <div className="checkout__item-image">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="72px"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div className="checkout__item-body">
                  <p className="checkout__item-name">
                    {item.name}
                    <span className="checkout__item-quantity">× {item.quantity}</span>
                  </p>

                  <ul className="checkout__item-choices">
                    <li>{item.stitching === "custom" ? "Custom stitched" : item.stitching === "unstitched" ? "Unstitched" : "Standard stitched"}</li>
                    {item.size ? <li>Size {item.size}</li> : null}
                    {item.lining ? <li>{item.lining}</li> : null}
                  </ul>

                  {item.measurements ? (
                    <p className="checkout__item-measurements">
                      <span>Bust {item.measurements.bust} · Waist {item.measurements.waist} · Hip {item.measurements.hip} · Shoulder {item.measurements.shoulder} · Sleeve {item.measurements.sleeveLength} · Length {item.measurements.dressLength} {item.measurements.unit}</span>
                    </p>
                  ) : null}

                  {item.notes ? (
                    <p className="checkout__item-note">Your note: {item.notes}</p>
                  ) : null}
                </div>

                <p className="checkout__item-price">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="checkout__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(totals?.subtotal ?? 0)}</dd>
            </div>
            {totals && totals.discount > 0 ? (
              <div className="checkout__totals-discount">
                <dt>Discount{totals.discountCode ? ` (${totals.discountCode})` : ""}</dt>
                <dd>-{formatPrice(totals.discount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Delivery</dt>
              <dd>{(totals?.shipping ?? 0) > 0 ? formatPrice(totals!.shipping) : "Free"}</dd>
            </div>
            <div className="checkout__totals-total">
              <dt>Total</dt>
              <dd>{formatPrice(totals?.total ?? 0)}</dd>
            </div>
          </dl>

          {message ? <p className="checkout__error">{message}</p> : null}

          <button type="submit" className="btn btn-primary checkout__submit" disabled={submitting}>
            {submitting ? "Placing your order…" : "Place order"}
          </button>

          <p className="checkout__secure">
            We never store your card details. Your order number and your email
            address are all you need to check on it later.
          </p>
        </aside>
      </div>
    </form>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useHydrated } from "@/hooks/useHydrated";
import { priceCart } from "@/lib/pricing";
import { MULTI_BUY_DISCOUNT_LABEL } from "@/lib/offers";
import {
  countryCurrency,
  countryMarketCode,
  SHIPPING_COUNTRIES,
} from "@/lib/countries";
import {
  firstCheckoutIssue,
  issuesByField,
  validateCheckoutInput,
  type CheckoutInput,
  type CheckoutIssue,
  type PaymentMethodChoice,
} from "@/lib/checkout-validation";

/** The control each field error belongs to, in form order. */
const FIELD_CONTROLS: Record<string, string> = {
  "contact.name": "checkout-name",
  "contact.email": "checkout-email",
  "contact.phone": "checkout-phone",
  "address.line1": "checkout-line1",
  "address.line2": "checkout-line2",
  "address.city": "checkout-city",
  "address.state": "checkout-state",
  "address.postalCode": "checkout-postal",
  "address.country": "checkout-country",
  deliveryNote: "checkout-note",
  items: "checkout-items",
  paymentMethod: "checkout-payment",
  termsAccepted: "checkout-terms",
  idempotencyKey: "checkout-error-summary",
};

function controlId(field: string): string {
  if (field.startsWith("items")) return "checkout-items";
  return FIELD_CONTROLS[field] ?? "checkout-error-summary";
}

function errorId(field: string): string {
  return `${controlId(field)}-error`;
}

/** One customer-facing message, wired to the control it describes. */
function FieldError({ field, message }: { field: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(field)} className="field__error">
      {message}
    </p>
  );
}

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
  const { cart, clearCart } = useCart();
  const { formatPrice, region, setRegionCode } = useCurrency();

  /** True once the browser has taken over from the server. */
  const hydrated = useHydrated();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ field: string; nonce: number } | null>(null);
  const focusNonce = useRef(0);

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

  /** The chosen country is the source of truth for the currency on this form. */
  const shippingCountry = address.country;

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

  /** Move the keyboard and the screen reader to the first bad field. */
  useEffect(() => {
    if (!focusRequest || !hydrated) return;

    const frame = requestAnimationFrame(() => {
      const paymentId = methods.includes("card")
        ? "checkout-payment-card"
        : "checkout-payment-cod";
      const id =
        focusRequest.field === "paymentMethod"
          ? paymentId
          : controlId(focusRequest.field);
      const element = document.getElementById(id) ?? document.getElementById("checkout-error-summary");

      if (!element) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "center",
      });
      element.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [focusRequest, hydrated, methods]);

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
  const priced = useMemo(() => priceCart(items), [items]);
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
      setMessage("");
    },
    []
  );

  const applyIssues = useCallback((issues: CheckoutIssue[], fallback: string) => {
    setErrors(issuesByField(issues));
    const first = firstCheckoutIssue(issues);
    setMessage(
      first
        ? `Please fix ${issues.length} field${issues.length === 1 ? "" : "s"}. First: ${first.message}`
        : fallback
    );
    if (first) {
      focusNonce.current += 1;
      setFocusRequest({ field: first.field, nonce: focusNonce.current });
    }
  }, []);

  const handleCountryChange = (code: string) => {
    setField("address", "country", code);
    // Country and currency are one choice: this writes the market cookies
    // and re-prices the cart pages as well as this form.
    setRegionCode(countryMarketCode(code));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrors({});
    setFocusRequest(null);

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
        country: shippingCountry,
      },
      deliveryNote,
      termsAccepted,
      items,
      paymentMethod,
      idempotencyKey: keyRef.current,
    };

    // The same schema the server uses, so mistakes are caught before the
    // order is sent.
    const validation = validateCheckoutInput(payload);

    if (!validation.valid) {
      applyIssues(validation.issues, "We could not place that order. Please try again.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      // An infrastructure failure can arrive as an empty body (a bare 500),
      // so read the text first. Parsing it as JSON unconditionally used to
      // turn a real server error into "we could not reach the shop".
      const raw = await response.text();
      let data: {
        ok?: boolean;
        error?: string;
        code?: string;
        issues?: { field: string; message: string }[];
        redirect?: string;
      } = {};

      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        data = {};
      }

      if (!response.ok || !data.ok) {
        const fallback = data.error
          ? data.error
          : response.status >= 500
            ? "The shop could not save your order just now. Please try again in a moment."
            : "We could not place that order. Please try again.";
        applyIssues(data.issues ?? [], fallback);
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

  const itemIssues = Object.entries(errors).filter(([field]) => field.startsWith("items"));
  const shippingCurrency = shippingCountry ? countryCurrency(shippingCountry) : region.currency;

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
                aria-invalid={Boolean(errors["contact.name"])}
                aria-describedby={errors["contact.name"] ? errorId("contact.name") : undefined}
                onChange={(event) => setField("contact", "name", event.target.value)}
              />
              <FieldError field="contact.name" message={errors["contact.name"]} />
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
                  aria-invalid={Boolean(errors["contact.email"])}
                  aria-describedby={errors["contact.email"] ? errorId("contact.email") : undefined}
                  onChange={(event) => setField("contact", "email", event.target.value)}
                />
                <FieldError field="contact.email" message={errors["contact.email"]} />
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
                  placeholder="+92 300 1234567"
                  value={contact.phone}
                  aria-invalid={Boolean(errors["contact.phone"])}
                  aria-describedby={errors["contact.phone"] ? errorId("contact.phone") : undefined}
                  onChange={(event) => setField("contact", "phone", event.target.value)}
                />
                <FieldError field="contact.phone" message={errors["contact.phone"]} />
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
                aria-invalid={Boolean(errors["address.line1"])}
                aria-describedby={errors["address.line1"] ? errorId("address.line1") : undefined}
                onChange={(event) => setField("address", "line1", event.target.value)}
              />
              <FieldError field="address.line1" message={errors["address.line1"]} />
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
                aria-invalid={Boolean(errors["address.line2"])}
                aria-describedby={errors["address.line2"] ? errorId("address.line2") : undefined}
                onChange={(event) => setField("address", "line2", event.target.value)}
              />
              <FieldError field="address.line2" message={errors["address.line2"]} />
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
                  aria-invalid={Boolean(errors["address.city"])}
                  aria-describedby={errors["address.city"] ? errorId("address.city") : undefined}
                  onChange={(event) => setField("address", "city", event.target.value)}
                />
                <FieldError field="address.city" message={errors["address.city"]} />
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
                  aria-invalid={Boolean(errors["address.state"])}
                  aria-describedby={errors["address.state"] ? errorId("address.state") : undefined}
                  onChange={(event) => setField("address", "state", event.target.value)}
                />
                <FieldError field="address.state" message={errors["address.state"]} />
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
                  aria-invalid={Boolean(errors["address.postalCode"])}
                  aria-describedby={
                    errors["address.postalCode"] ? errorId("address.postalCode") : undefined
                  }
                  onChange={(event) =>
                    setField("address", "postalCode", event.target.value)
                  }
                />
                <FieldError field="address.postalCode" message={errors["address.postalCode"]} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-country">
                  Shipping country
                </label>
                <select
                  id="checkout-country"
                  name="country"
                  className="field__input"
                  autoComplete="country"
                  value={shippingCountry}
                  aria-invalid={Boolean(errors["address.country"])}
                  aria-describedby={
                    `checkout-country-currency${errors["address.country"] ? ` ${errorId("address.country")}` : ""}`
                  }
                  onChange={(event) => handleCountryChange(event.target.value)}
                >
                  <option value="">Choose a country</option>
                  {SHIPPING_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.currency})
                    </option>
                  ))}
                </select>
                <p id="checkout-country-currency" className="field__hint">
                  Prices and payment in {shippingCurrency}.
                </p>
                <FieldError field="address.country" message={errors["address.country"]} />
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
                aria-invalid={Boolean(errors.deliveryNote)}
                aria-describedby={errors.deliveryNote ? errorId("deliveryNote") : undefined}
                onChange={(event) => setDeliveryNote(event.target.value)}
              />
              <FieldError field="deliveryNote" message={errors.deliveryNote} />
            </div>
          </section>

          {/* Payment ------------------------------------------------ */}
          <section className="checkout__block">
            <h2 className="checkout__block-title">Payment</h2>

            <div
              className="checkout__options"
              role="radiogroup"
              aria-label="Payment method"
              aria-invalid={Boolean(errors.paymentMethod)}
              aria-describedby={errors.paymentMethod ? errorId("paymentMethod") : undefined}
            >
              {methods.includes("card") ? (
                <label className="checkout__option">
                  <input
                    id="checkout-payment-card"
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
                    id="checkout-payment-cod"
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

            <FieldError field="paymentMethod" message={errors.paymentMethod} />
          </section>

          {/* Terms -------------------------------------------------- */}
          <section className="checkout__block">
            <label className="checkout__terms">
              <input
                id="checkout-terms"
                type="checkbox"
                name="termsAccepted"
                checked={termsAccepted}
                aria-invalid={Boolean(errors.termsAccepted)}
                aria-describedby={errors.termsAccepted ? errorId("termsAccepted") : undefined}
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
            <FieldError field="termsAccepted" message={errors.termsAccepted} />
          </section>
        </div>

        {/* The summary ------------------------------------------------ */}
        <aside className="checkout__summary">
          <h2 className="checkout__block-title">Order summary</h2>

          {message ? (
            <p
              id="checkout-error-summary"
              className="checkout__error"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              {message}
            </p>
          ) : null}

          <ul
            className="checkout__items"
            id="checkout-items"
            tabIndex={-1}
            aria-describedby={itemIssues.length > 0 ? "checkout-item-errors" : undefined}
          >
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
                  {formatPrice(item.price * item.quantity, shippingCurrency)}
                </p>
              </li>
            ))}
          </ul>

          {itemIssues.length > 0 ? (
            <ul className="checkout__item-errors" id="checkout-item-errors">
              {itemIssues.map(([field, issueMessage]) => (
                <li key={field} className="field__error">
                  {issueMessage}
                </li>
              ))}
            </ul>
          ) : null}

          <dl className="checkout__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(totals?.subtotal ?? 0, shippingCurrency)}</dd>
            </div>
            {totals && totals.discount > 0 ? (
              <div className="checkout__totals-discount">
                <dt>{MULTI_BUY_DISCOUNT_LABEL}</dt>
                <dd>-{formatPrice(totals.discount, shippingCurrency)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Delivery</dt>
              <dd>
                {(totals?.shipping ?? 0) > 0
                  ? formatPrice(totals!.shipping, shippingCurrency)
                  : "Free"}
              </dd>
            </div>
            <div className="checkout__totals-total">
              <dt>Total</dt>
              <dd>{formatPrice(totals?.total ?? 0, shippingCurrency)}</dd>
            </div>
          </dl>

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

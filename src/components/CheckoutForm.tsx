"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, cartLineKey, type CartItem } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useCatalogProducts } from "@/components/StoreCatalogProvider";
import { MAX_QUANTITY_PER_LINE, priceCart } from "@/lib/pricing";
import { MULTI_BUY_DISCOUNT_LABEL } from "@/lib/offers";
import { standardSizes } from "@/lib/products";
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

/** A fresh key for every distinct order, used for safe retries. */
function makeIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  const {
    cart,
    buyNow,
    clearCart,
    clearBuyNow,
    removeFromCart,
    updateQuantity,
    updateCartLineSelection,
    updateBuyNowQuantity,
  } = useCart();
  const catalog = useCatalogProducts();
  const { formatPrice, region, setRegionCode } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * `?buyNow=1` selects the one-piece order. The piece itself is read from
   * the same persistent store as the cart, so a refresh of this page keeps
   * the order intact. Without the flag the form uses the ordinary cart.
   */
  const buyNowMode = searchParams.get("buyNow") === "1";
  const isBuyNow = buyNowMode && buyNow !== null;
  const lines: CartItem[] = useMemo(
    () => (isBuyNow && buyNow ? [buyNow] : cart),
    [buyNow, cart, isBuyNow]
  );

  /** True once the browser has taken over from the server. */
  const hydrated = useHydrated();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ field: string; nonce: number } | null>(null);
  const focusNonce = useRef(0);
  const [formTouched, setFormTouched] = useState(false);
  const markTouched = useCallback(() => setFormTouched(true), []);

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
   * An empty order has no business being here. Once the browser has read the
   * cart, send the customer back to the cart page (which explains that it is
   * empty) instead of showing a checkout with nothing in it.
   */
  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) router.replace("/cart");
  }, [hydrated, lines.length, router]);

  /**
   * The key that makes creating the order safe to repeat. It is made on the
   * first submit attempt and reset when the order lines change, so pressing
   * "place order" twice sends the same key and gets one order, not two.
   */
  const keyRef = useRef("");
  const cartSignature = useMemo(
    () =>
      lines
        .map(
          (item) =>
            `${item.slug}:${item.quantity}:${item.stitching}:${item.size ?? ""}:${
              item.lining ?? ""
            }:${item.measurements ? JSON.stringify(item.measurements) : ""}`
        )
        .join("|"),
    [lines]
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
      lines.map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
        stitching: item.stitching,
        ...(item.size ? { size: item.size } : {}),
        ...(item.lining ? { lining: item.lining } : {}),
        ...(item.measurements ? { measurements: item.measurements } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    [lines]
  );

  /** The totals, worked out from the catalogue. */
  const priced = useMemo(() => priceCart(items, catalog), [items, catalog]);
  const totals = priced.ok ? priced.order : null;

  /** The same payload the server will validate, kept in one place. */
  const payload: CheckoutInput = useMemo(
    () => ({
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
      // The real key is added on submit. This stand-in lets the shared schema
      // check the customer's details without depending on browser-only state.
      idempotencyKey: "checkout-pending-key",
    }),
    [address, contact, deliveryNote, items, paymentMethod, shippingCountry, termsAccepted]
  );

  const validation = useMemo(() => validateCheckoutInput(payload), [payload]);
  const liveErrors = useMemo(
    () => (validation.valid ? {} : issuesByField(validation.issues)),
    [validation]
  );
  /** Server messages win; field messages appear once the customer starts. */
  const visibleErrors = formTouched ? { ...liveErrors, ...errors } : errors;
  const canPlaceOrder =
    validation.valid && priced.ok && lines.length > 0 && !submitting;

  const setField = useCallback(
    (group: "contact" | "address", field: string, value: string) => {
      setFormTouched(true);

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
    setFormTouched(true);

    const key = keyRef.current || makeIdempotencyKey();
    keyRef.current = key;
    const submission: CheckoutInput = { ...payload, idempotencyKey: key };

    // The same schema the server uses, so mistakes are caught before the
    // order is sent.
    const check = validateCheckoutInput(submission);

    if (!check.valid) {
      applyIssues(check.issues, "We could not place that order. Please try again.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
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

      // The order is with us now. Only the lines used for this order are
      // spent: a Buy now order must not empty the saved cart, and a cart
      // checkout must not leave a stale Buy now line behind.
      if (isBuyNow) clearBuyNow();
      else {
        clearCart();
        // A stale Buy now line must not resurface in a later checkout.
        clearBuyNow();
      }

      if (data.redirect) {
        window.location.assign(data.redirect);
      }
    } catch {
      setMessage("We could not reach the shop. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  const itemIssues = Object.entries(visibleErrors).filter(([field]) => field.startsWith("items"));
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

  /* No order lines. The effect above takes the customer back to the cart. */
  if (lines.length === 0) {
    return (
      <div className="checkout checkout--empty" role="status" aria-live="polite">
        <h2>{buyNowMode ? "Your Buy now order is empty" : "Your cart is empty"}</h2>
        <p>Taking you back to your cart — choose a piece to order.</p>
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
                aria-invalid={Boolean(visibleErrors["contact.name"])}
                aria-describedby={visibleErrors["contact.name"] ? errorId("contact.name") : undefined}
                onChange={(event) => setField("contact", "name", event.target.value)}
              />
              <FieldError field="contact.name" message={visibleErrors["contact.name"]} />
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
                  aria-invalid={Boolean(visibleErrors["contact.email"])}
                  aria-describedby={visibleErrors["contact.email"] ? errorId("contact.email") : undefined}
                  onChange={(event) => setField("contact", "email", event.target.value)}
                />
                <FieldError field="contact.email" message={visibleErrors["contact.email"]} />
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
                  aria-invalid={Boolean(visibleErrors["contact.phone"])}
                  aria-describedby={visibleErrors["contact.phone"] ? errorId("contact.phone") : undefined}
                  onChange={(event) => setField("contact", "phone", event.target.value)}
                />
                <FieldError field="contact.phone" message={visibleErrors["contact.phone"]} />
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
                aria-invalid={Boolean(visibleErrors["address.line1"])}
                aria-describedby={visibleErrors["address.line1"] ? errorId("address.line1") : undefined}
                onChange={(event) => setField("address", "line1", event.target.value)}
              />
              <FieldError field="address.line1" message={visibleErrors["address.line1"]} />
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
                aria-invalid={Boolean(visibleErrors["address.line2"])}
                aria-describedby={visibleErrors["address.line2"] ? errorId("address.line2") : undefined}
                onChange={(event) => setField("address", "line2", event.target.value)}
              />
              <FieldError field="address.line2" message={visibleErrors["address.line2"]} />
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
                  aria-invalid={Boolean(visibleErrors["address.city"])}
                  aria-describedby={visibleErrors["address.city"] ? errorId("address.city") : undefined}
                  onChange={(event) => setField("address", "city", event.target.value)}
                />
                <FieldError field="address.city" message={visibleErrors["address.city"]} />
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
                  aria-invalid={Boolean(visibleErrors["address.state"])}
                  aria-describedby={visibleErrors["address.state"] ? errorId("address.state") : undefined}
                  onChange={(event) => setField("address", "state", event.target.value)}
                />
                <FieldError field="address.state" message={visibleErrors["address.state"]} />
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
                  aria-invalid={Boolean(visibleErrors["address.postalCode"])}
                  aria-describedby={
                    visibleErrors["address.postalCode"] ? errorId("address.postalCode") : undefined
                  }
                  onChange={(event) =>
                    setField("address", "postalCode", event.target.value)
                  }
                />
                <FieldError field="address.postalCode" message={visibleErrors["address.postalCode"]} />
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
                  aria-invalid={Boolean(visibleErrors["address.country"])}
                  aria-describedby={
                    `checkout-country-currency${visibleErrors["address.country"] ? ` ${errorId("address.country")}` : ""}`
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
                <FieldError field="address.country" message={visibleErrors["address.country"]} />
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
                aria-invalid={Boolean(visibleErrors.deliveryNote)}
                aria-describedby={visibleErrors.deliveryNote ? errorId("deliveryNote") : undefined}
                onChange={(event) => {
                  setDeliveryNote(event.target.value);
                  markTouched();
                }}
              />
              <FieldError field="deliveryNote" message={visibleErrors.deliveryNote} />
            </div>
          </section>

          {/* Payment ------------------------------------------------ */}
          <section className="checkout__block">
            <h2 className="checkout__block-title">Payment</h2>

            <div
              className="checkout__options"
              role="radiogroup"
              aria-label="Payment method"
              aria-invalid={Boolean(visibleErrors.paymentMethod)}
              aria-describedby={visibleErrors.paymentMethod ? errorId("paymentMethod") : undefined}
            >
              {methods.includes("card") ? (
                <label className="checkout__option">
                  <input
                    id="checkout-payment-card"
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => {
                      setPaymentMethod("card");
                      markTouched();
                    }}
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
                    onChange={() => {
                      setPaymentMethod("cod");
                      markTouched();
                    }}
                  />
                  <span>
                    <strong>Cash on delivery</strong>
                    <small>Pay the courier when the parcel arrives.</small>
                  </span>
                </label>
              ) : null}
            </div>

            <FieldError field="paymentMethod" message={visibleErrors.paymentMethod} />
          </section>

          {/* Terms -------------------------------------------------- */}
          <section className="checkout__block">
            <label className="checkout__terms">
              <input
                id="checkout-terms"
                type="checkbox"
                name="termsAccepted"
                checked={termsAccepted}
                aria-invalid={Boolean(visibleErrors.termsAccepted)}
                aria-describedby={visibleErrors.termsAccepted ? errorId("termsAccepted") : undefined}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  markTouched();
                }}
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
            <FieldError field="termsAccepted" message={visibleErrors.termsAccepted} />
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
            {lines.map((item, index) => {
              const lineKey = cartLineKey(item);
              const pricedLine = totals?.lines[index];
              const changeQuantity = (next: number) => {
                if (isBuyNow) updateBuyNowQuantity(next);
                else updateQuantity(lineKey, next);
              };
              const removeItem = () => {
                if (isBuyNow) clearBuyNow();
                else removeFromCart(lineKey);
              };

              return (
                <li className="checkout__item" key={lineKey}>
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
                    <p className="checkout__item-name">{item.name}</p>

                    <ul className="checkout__item-choices">
                      <li>{item.stitching === "custom" ? "Custom stitched" : item.stitching === "unstitched" ? "Unstitched" : "Standard stitched"}</li>
                      {item.size ? <li>Size {item.size}</li> : null}
                      {item.lining ? <li>{item.lining}</li> : null}
                    </ul>

                    {/* Older carts can hold a line saved before a size was
                        chosen. Let it be put right here instead of blocking
                        the order with no way forward. */}
                    {!isBuyNow && item.stitching === "standard" && !item.size ? (
                      <div className="checkout__item-fix">
                        <label htmlFor={`checkout-size-${index}`}>
                          Choose a size for {item.name}
                        </label>
                        <select
                          id={`checkout-size-${index}`}
                          value=""
                          onChange={(event) =>
                            updateCartLineSelection(lineKey, { size: event.target.value })
                          }
                        >
                          <option value="">Choose a size…</option>
                          {standardSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {!isBuyNow && item.stitching === "custom" && !item.measurements ? (
                      <p className="checkout__item-fix">
                        This piece needs your measurements.{" "}
                        <Link href={`/products/${item.slug}`}>Add them here</Link>.
                      </p>
                    ) : null}

                    {item.measurements ? (
                      <p className="checkout__item-measurements">
                        <span>Bust {item.measurements.bust} · Waist {item.measurements.waist} · Hip {item.measurements.hip} · Shoulder {item.measurements.shoulder} · Sleeve {item.measurements.sleeveLength} · Length {item.measurements.dressLength} {item.measurements.unit}</span>
                      </p>
                    ) : null}

                    {item.notes ? (
                      <p className="checkout__item-note">Your note: {item.notes}</p>
                    ) : null}

                    <p className="checkout__item-unit">
                      Unit price {formatPrice(pricedLine?.unitPrice ?? item.price, shippingCurrency)}
                    </p>

                    <div className="checkout__item-controls">
                      <div className="cart-qty" aria-label={`Quantity for ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.quantity + 1)}
                          disabled={item.quantity >= MAX_QUANTITY_PER_LINE}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="checkout__item-remove"
                        onClick={removeItem}
                        aria-label={`Remove ${item.name} from order`}
                      >
                        <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="checkout__item-price">
                    {formatPrice(pricedLine?.lineTotal ?? item.price * item.quantity, shippingCurrency)}
                  </p>
                </li>
              );
            })}
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
            <div>
              <dt>Tax</dt>
              <dd>None</dd>
            </div>
            <div className="checkout__totals-total">
              <dt>Grand total</dt>
              <dd>{formatPrice(totals?.total ?? 0, shippingCurrency)}</dd>
            </div>
          </dl>

          {!canPlaceOrder && !submitting ? (
            <p id="checkout-form-hint" className="checkout__form-hint">
              {!priced.ok
                ? priced.error
                : "Fill in the required details and accept the terms to place your order."}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary checkout__submit"
            disabled={!canPlaceOrder}
            aria-describedby={!canPlaceOrder ? "checkout-form-hint" : undefined}
          >
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

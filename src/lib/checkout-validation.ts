/**
 * Checkout validation — the rules the checkout form follows.
 *
 * This module is shared by the browser and the server, and that is the
 * whole point of it. The form in the browser checks the fields as the
 * customer types, so mistakes are caught early; the route handler checks
 * the very same rules again when the form is sent, because a form can be
 * edited in the browser and a request can be written by hand. One set of
 * rules means the two checks can never drift apart.
 *
 * The rules are deliberately plain: required fields, sensible lengths,
 * and the stitching rules the catalogue already defines (a piece is only
 * offered in the ways the catalogue says it is, custom stitching needs
 * measurements, standard stitching needs a size).
 */

import {
  getProductBySlug,
  measurementFields,
  standardSizes,
  validateMeasurements,
  type Measurements,
  type MeasurementKey,
  type StitchingOption,
} from "@/lib/products";
import { MAX_QUANTITY_PER_LINE, MAX_LINES_PER_ORDER, type CartLineInput } from "@/lib/pricing";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** Who to write to about the order. */
export interface CheckoutContact {
  name: string;
  email: string;
  phone: string;
}

/** Where the order is going. */
export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

/** How the customer is paying. */
export type PaymentMethodChoice = "card" | "cod";

/** Everything the checkout form sends. */
export interface CheckoutInput {
  contact: CheckoutContact;
  address: CheckoutAddress;
  /** Anything the courier or the tailor should know. */
  deliveryNote: string;
  /** True only when the customer ticked the terms box. */
  termsAccepted: boolean;
  /** The pieces, as the browser describes them. */
  items: CartLineInput[];
  /** The discount code, if there is one. */
  discountCode: string;
  /** How the customer wants to pay. */
  paymentMethod: PaymentMethodChoice;
  /** A key that makes creating the order safe to repeat. */
  idempotencyKey: string;
}

/** One thing that is wrong, and where it is wrong. */
export interface CheckoutIssue {
  /** The field the message belongs to, e.g. "contact.email". */
  field: string;
  /** The message for the customer. */
  message: string;
}

/** What the validation says. */
export type CheckoutValidation =
  | { valid: true; value: CheckoutInput }
  | { valid: false; issues: CheckoutIssue[] };

/* ------------------------------------------------------------------ *
 * Limits
 * ------------------------------------------------------------------ */

/** The longest name we keep. */
export const MAX_NAME_LENGTH = 80;

/** The longest email address we keep. */
export const MAX_EMAIL_LENGTH = 200;

/** The longest phone number we keep. */
export const MAX_PHONE_LENGTH = 25;

/** The longest address line we keep. */
export const MAX_ADDRESS_LENGTH = 200;

/** The longest city, state or country name we keep. */
export const MAX_PLACE_LENGTH = 80;

/** The longest postal code we keep. */
export const MAX_POSTAL_CODE_LENGTH = 20;

/** The longest delivery note we keep. */
export const MAX_DELIVERY_NOTE_LENGTH = 500;

/** The longest note on one piece we keep. */
export const MAX_ITEM_NOTE_LENGTH = 300;

/** A plain, forgiving email check — the provider is the real judge. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Phone numbers may hold spaces, brackets and a leading plus. */
const PHONE_PATTERN = /^[0-9+()\-.\s]{6,25}$/;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Read a string field, trimmed. */
function readString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Read a boolean field. */
function readBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === "1";
}

/** Read a plain object, or an empty one when it is not an object. */
function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** The measurements as the catalogue expects them, or null when they are broken. */
function readMeasurements(value: unknown): Measurements | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const unit = raw.unit === "cm" ? "cm" : "in";

  const measurements: Measurements = {
    unit,
    bust: Number(raw.bust),
    waist: Number(raw.waist),
    hip: Number(raw.hip),
    shoulder: Number(raw.shoulder),
    sleeveLength: Number(raw.sleeveLength),
    dressLength: Number(raw.dressLength),
  };

  return measurements;
}

/** The measurements as typed values, so the catalogue can check them. */
function measurementValues(measurements: Measurements) {
  const values: Record<MeasurementKey, string> = {
    bust: String(measurements.bust),
    waist: String(measurements.waist),
    hip: String(measurements.hip),
    shoulder: String(measurements.shoulder),
    sleeveLength: String(measurements.sleeveLength),
    dressLength: String(measurements.dressLength),
  };

  return values;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * Check everything the checkout form sent.
 *
 * Returns the cleaned-up input when it is all good, and a list of
 * messages when it is not. The messages are written for customers, so
 * they can be shown as they are.
 */
export function validateCheckoutInput(raw: unknown): CheckoutValidation {
  const issues: CheckoutIssue[] = [];
  const input = readObject(raw);

  /* Contact ---------------------------------------------------------- */
  const contactRaw = readObject(input.contact);
  const name = readString(contactRaw.name);
  const email = readString(contactRaw.email);
  const phone = readString(contactRaw.phone);

  if (name.length < 2) {
    issues.push({ field: "contact.name", message: "Please tell us your name." });
  } else if (name.length > MAX_NAME_LENGTH) {
    issues.push({
      field: "contact.name",
      message: `Please keep your name under ${MAX_NAME_LENGTH} characters.`,
    });
  }

  if (!email) {
    issues.push({ field: "contact.email", message: "We need an email address to send your confirmation." });
  } else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    issues.push({ field: "contact.email", message: "That email address does not look right." });
  }

  if (!phone) {
    issues.push({ field: "contact.phone", message: "We need a phone number for the courier." });
  } else if (!PHONE_PATTERN.test(phone)) {
    issues.push({ field: "contact.phone", message: "That phone number does not look right." });
  }

  /* Address --------------------------------------------------------- */
  const addressRaw = readObject(input.address);
  const line1 = readString(addressRaw.line1);
  const line2 = readString(addressRaw.line2);
  const city = readString(addressRaw.city);
  const state = readString(addressRaw.state);
  const postalCode = readString(addressRaw.postalCode);
  const country = readString(addressRaw.country);

  if (!line1) {
    issues.push({ field: "address.line1", message: "Please give us the street address." });
  } else if (line1.length > MAX_ADDRESS_LENGTH) {
    issues.push({
      field: "address.line1",
      message: `Please keep the address under ${MAX_ADDRESS_LENGTH} characters.`,
    });
  }

  if (line2.length > MAX_ADDRESS_LENGTH) {
    issues.push({
      field: "address.line2",
      message: `Please keep this under ${MAX_ADDRESS_LENGTH} characters.`,
    });
  }

  if (!city) {
    issues.push({ field: "address.city", message: "Please give us the city." });
  } else if (city.length > MAX_PLACE_LENGTH) {
    issues.push({
      field: "address.city",
      message: `Please keep the city under ${MAX_PLACE_LENGTH} characters.`,
    });
  }

  if (state.length > MAX_PLACE_LENGTH) {
    issues.push({
      field: "address.state",
      message: `Please keep this under ${MAX_PLACE_LENGTH} characters.`,
    });
  }

  if (postalCode.length > MAX_POSTAL_CODE_LENGTH) {
    issues.push({
      field: "address.postalCode",
      message: `Please keep the postal code under ${MAX_POSTAL_CODE_LENGTH} characters.`,
    });
  }

  if (!country) {
    issues.push({ field: "address.country", message: "Please tell us which country to send it to." });
  } else if (country.length > MAX_PLACE_LENGTH) {
    issues.push({
      field: "address.country",
      message: `Please keep the country under ${MAX_PLACE_LENGTH} characters.`,
    });
  }

  /* Delivery note ---------------------------------------------------- */
  const deliveryNote = readString(input.deliveryNote);
  if (deliveryNote.length > MAX_DELIVERY_NOTE_LENGTH) {
    issues.push({
      field: "deliveryNote",
      message: `Please keep the delivery note under ${MAX_DELIVERY_NOTE_LENGTH} characters.`,
    });
  }

  /* Terms ------------------------------------------------------------ */
  const termsAccepted = readBoolean(input.termsAccepted);
  if (!termsAccepted) {
    issues.push({
      field: "termsAccepted",
      message: "Please accept the terms and the returns policy to place your order.",
    });
  }

  /* Payment method --------------------------------------------------- */
  const paymentMethodRaw = readString(input.paymentMethod).toLowerCase();
  const paymentMethod: PaymentMethodChoice | null =
    paymentMethodRaw === "cod" ? "cod" : paymentMethodRaw === "card" ? "card" : null;

  if (!paymentMethod) {
    issues.push({ field: "paymentMethod", message: "Please choose how you would like to pay." });
  }

  /* Idempotency key -------------------------------------------------- */
  const idempotencyKey = readString(input.idempotencyKey);
  if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    issues.push({
      field: "idempotencyKey",
      message: "This checkout could not be started. Please refresh the page and try again.",
    });
  }

  /* Items ------------------------------------------------------------ */
  const itemsRaw = Array.isArray(input.items) ? input.items : [];
  const items: CartLineInput[] = [];

  if (itemsRaw.length === 0) {
    issues.push({ field: "items", message: "Your cart is empty." });
  } else if (itemsRaw.length > MAX_LINES_PER_ORDER) {
    issues.push({
      field: "items",
      message: `An order can hold ${MAX_LINES_PER_ORDER} different pieces at once.`,
    });
  }

  itemsRaw.forEach((entry, index) => {
    const line = readObject(entry);
    const slug = readString(line.slug);
    const product = getProductBySlug(slug);

    if (!product) {
      issues.push({
        field: `items.${index}.slug`,
        message: "One of the pieces in your cart is no longer in our collection.",
      });
      return;
    }

    if (product.availability === "out_of_stock") {
      issues.push({
        field: `items.${index}.slug`,
        message: `${product.name} has sold out. Please remove it to place your order.`,
      });
      return;
    }

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      issues.push({
        field: `items.${index}.quantity`,
        message: `Please choose between 1 and ${MAX_QUANTITY_PER_LINE} of ${product.name}.`,
      });
      return;
    }

    const stitchingRaw = readString(line.stitching);
    const stitching = (["unstitched", "standard", "custom"] as StitchingOption[]).includes(
      stitchingRaw as StitchingOption
    )
      ? (stitchingRaw as StitchingOption)
      : "standard";

    if (!product.stitching.includes(stitching)) {
      issues.push({
        field: `items.${index}.stitching`,
        message: `${product.name} is not available with that stitching.`,
      });
      return;
    }

    const size = readString(line.size);
    const lining = readString(line.lining);
    const notes = readString(line.notes);

    if (stitching === "standard") {
      if (!size) {
        issues.push({
          field: `items.${index}.size`,
          message: `Please choose a size for ${product.name}.`,
        });
        return;
      }

      if (!standardSizes.includes(size)) {
        issues.push({
          field: `items.${index}.size`,
          message: "That size is not one we make.",
        });
        return;
      }
    }

    let measurements: Measurements | undefined;

    if (stitching === "custom") {
      const raw = readMeasurements(line.measurements);

      if (!raw) {
        issues.push({
          field: `items.${index}.measurements`,
          message: `Please add your measurements for ${product.name}.`,
        });
        return;
      }

      const check = validateMeasurements(measurementValues(raw), raw.unit);

      if (!check.valid) {
        const firstField = Object.keys(check.errors)[0] as MeasurementKey | undefined;
        const message =
          (firstField ? check.errors[firstField] : undefined) ??
          "Those measurements do not look right.";

        issues.push({ field: `items.${index}.measurements`, message });
        return;
      }

      measurements = raw;
    }

    if (notes.length > MAX_ITEM_NOTE_LENGTH) {
      issues.push({
        field: `items.${index}.notes`,
        message: `Please keep notes under ${MAX_ITEM_NOTE_LENGTH} characters.`,
      });
      return;
    }

    const priced: CartLineInput = { slug: product.slug, quantity, stitching };
    if (size) priced.size = size;
    if (lining) priced.lining = lining;
    if (measurements) priced.measurements = measurements;
    if (notes) priced.notes = notes;

    items.push(priced);
  });

  /* The discount code ------------------------------------------------ */
  const discountCode = readString(input.discountCode).toUpperCase();

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    value: {
      contact: { name, email, phone },
      address: {
        line1,
        ...(line2 ? { line2 } : {}),
        city,
        ...(state ? { state } : {}),
        ...(postalCode ? { postalCode } : {}),
        country,
      },
      deliveryNote,
      termsAccepted,
      items,
      discountCode,
      paymentMethod: paymentMethod ?? "card",
      idempotencyKey,
    },
  };
}

/**
 * The messages for a list of issues, keyed by field.
 *
 * The form uses this to put each message under the box it belongs to.
 */
export function issuesByField(issues: CheckoutIssue[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const issue of issues) {
    if (!map[issue.field]) map[issue.field] = issue.message;
  }

  return map;
}

/** The measurements fields, re-exported so the form and the rules agree. */
export { measurementFields };

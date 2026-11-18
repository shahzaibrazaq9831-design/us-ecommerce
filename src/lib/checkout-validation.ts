/**
 * Checkout validation — one Zod schema, used in the browser and on the server.
 *
 * The form checks the schema as the customer submits, so mistakes are caught
 * before a request is sent. The API checks the very same schema again, because
 * a request can be written by hand. One schema means the two checks cannot
 * drift apart, and every failed check carries the exact field path so the
 * server can tell the form which box to mark and which message to show.
 */

import { z } from "zod";
import {
  getProductBySlug,
  measurementFields,
  standardSizes,
  validateMeasurements,
  type MeasurementKey,
  type Measurements,
  type StitchingOption,
} from "@/lib/products";
import { MAX_QUANTITY_PER_LINE, MAX_LINES_PER_ORDER, type CartLineInput } from "@/lib/pricing";
import {
  isSupportedShippingCountry,
  normalizeCountryCode,
} from "@/lib/countries";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** Who to write to about the order. */
export interface CheckoutContact {
  name: string;
  email: string;
  phone: string;
}

/** Where the order is going. `country` is one of the shipping market codes. */
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

export const MAX_NAME_LENGTH = 80;
export const MAX_EMAIL_LENGTH = 200;
export const MAX_PHONE_LENGTH = 25;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_PLACE_LENGTH = 80;
export const MAX_POSTAL_CODE_LENGTH = 20;
export const MAX_DELIVERY_NOTE_LENGTH = 500;
export const MAX_ITEM_NOTE_LENGTH = 300;

/** The order the form is laid out in, used to focus the first bad field. */
export const CHECKOUT_FIELD_ORDER = [
  "contact.name",
  "contact.email",
  "contact.phone",
  "address.line1",
  "address.line2",
  "address.city",
  "address.state",
  "address.postalCode",
  "address.country",
  "deliveryNote",
  "items",
  "paymentMethod",
  "termsAccepted",
  "idempotencyKey",
] as const;

/* ------------------------------------------------------------------ *
 * Phone numbers
 * ------------------------------------------------------------------ */

/** Digits only, so spaces, brackets and dashes are all accepted. */
function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Check a phone number against the selected shipping market.
 *
 * Pakistan and the UK have their own familiar national formats. Everywhere
 * else we ask for an international number with its country code, because a
 * bare local number cannot tell us which country it belongs to.
 */
export function isValidPhone(value: string, countryCode: string): boolean {
  const phone = value.trim();

  // The character check keeps letters and punctuation out before we look at
  // the digit count. A leading + or 00 is the only country-code marker.
  if (!/^\+?[0-9()\-. ]{6,25}$/.test(phone)) return false;

  const digits = phoneDigits(phone).replace(/^0092/, "92").replace(/^0044/, "44");
  const hasPlus = phone.startsWith("+");

  if (countryCode === "PK") {
    const national = digits.startsWith("92") ? digits.slice(2) : digits;
    return /^0?3\d{9}$/.test(national);
  }

  if (countryCode === "GB") {
    if (digits.startsWith("44")) return /^44\d{9,10}$/.test(digits);
    return /^0\d{9,10}$/.test(digits);
  }

  // Outside the two national formats, the number has to carry its country
  // code: either +<code> or the 00<code> international dialling prefix.
  if (hasPlus) return /^[1-9]\d{7,14}$/.test(digits);
  return /^00[1-9]\d{7,14}$/.test(digits);
}

/** The phone message that matches the market the customer picked. */
export function phoneErrorMessage(countryCode: string): string {
  if (countryCode === "PK") {
    return "Enter a valid Pakistani number, e.g. 0300 1234567 or +92 300 1234567.";
  }
  if (countryCode === "GB") {
    return "Enter a valid UK number, e.g. 07700 900123 or +44 7700 900123.";
  }
  return "Enter a valid phone number with country code, e.g. +1 555 123 4567.";
}

/* ------------------------------------------------------------------ *
 * Zod schema
 * ------------------------------------------------------------------ */

/** Trim a required string before the other rules run. */
function requiredText(max: number, message: string, maxMessage: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string({ error: message }).min(1, message).max(max, maxMessage)
  );
}

/** An empty optional string is treated as "not supplied". */
function optionalText(max: number, message: string) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string({ error: message }).trim().max(max, message).optional()
  );
}

const measurementsSchema = z.object({
  unit: z.enum(["cm", "in"], { error: "Choose cm or inches." }),
  bust: z.number({ error: "Enter the bust measurement." }),
  waist: z.number({ error: "Enter the waist measurement." }),
  hip: z.number({ error: "Enter the hip measurement." }),
  shoulder: z.number({ error: "Enter the shoulder measurement." }),
  sleeveLength: z.number({ error: "Enter the sleeve measurement." }),
  dressLength: z.number({ error: "Enter the dress length." }),
});

const itemSchema = z.object({
  slug: requiredText(200, "One of the pieces in your cart has no design.", "That design is not valid."),
  quantity: z.number({ error: "Enter a quantity." }).int("Enter a whole number.").min(1, "Choose at least one.").max(
    MAX_QUANTITY_PER_LINE,
    `Please choose no more than ${MAX_QUANTITY_PER_LINE} of one piece.`
  ),
  stitching: z.enum(["unstitched", "standard", "custom"], {
    error: "Choose how you would like that piece made.",
  }).default("standard"),
  size: optionalText(80, "Please keep the size under 80 characters."),
  lining: optionalText(80, "Please keep the lining under 80 characters."),
  measurements: measurementsSchema.optional(),
  notes: optionalText(MAX_ITEM_NOTE_LENGTH, `Please keep notes under ${MAX_ITEM_NOTE_LENGTH} characters.`),
});

/** The single source of truth for checkout input. */
export const checkoutSchema = z
  .object({
    contact: z.object({
      name: requiredText(MAX_NAME_LENGTH, "Please tell us your name.", `Please keep your name under ${MAX_NAME_LENGTH} characters.`),
      email: z
        .string({ error: "We need an email address to send your confirmation." })
        .trim()
        .min(1, "We need an email address to send your confirmation.")
        .max(MAX_EMAIL_LENGTH, `Please keep your email under ${MAX_EMAIL_LENGTH} characters.`)
        .email("That email address does not look right."),
      phone: requiredText(MAX_PHONE_LENGTH, "We need a phone number for the courier.", `Please keep your phone number under ${MAX_PHONE_LENGTH} characters.`),
    }),
    address: z.object({
      line1: requiredText(MAX_ADDRESS_LENGTH, "Please give us the street address.", `Please keep the address under ${MAX_ADDRESS_LENGTH} characters.`),
      line2: optionalText(MAX_ADDRESS_LENGTH, `Please keep this under ${MAX_ADDRESS_LENGTH} characters.`),
      city: requiredText(MAX_PLACE_LENGTH, "Please give us the city.", `Please keep the city under ${MAX_PLACE_LENGTH} characters.`),
      state: optionalText(MAX_PLACE_LENGTH, `Please keep this under ${MAX_PLACE_LENGTH} characters.`),
      postalCode: optionalText(MAX_POSTAL_CODE_LENGTH, `Please keep the postal code under ${MAX_POSTAL_CODE_LENGTH} characters.`),
      country: z
        .string({ error: "Please tell us which country to send it to." })
        .trim()
        .min(1, "Please tell us which country to send it to.")
        .transform(normalizeCountryCode)
        .refine(isSupportedShippingCountry, "Choose one of the shipping countries from the list."),
    }),
    deliveryNote: optionalText(MAX_DELIVERY_NOTE_LENGTH, `Please keep the delivery note under ${MAX_DELIVERY_NOTE_LENGTH} characters.`),
    termsAccepted: z.literal(true, {
      error: "Please accept the terms and the returns policy to place your order.",
    }),
    items: z
      .array(itemSchema)
      .min(1, "Your cart is empty.")
      .max(MAX_LINES_PER_ORDER, `An order can hold ${MAX_LINES_PER_ORDER} different pieces at once.`),
    paymentMethod: z.enum(["card", "cod"], {
      error: "Please choose how you would like to pay.",
    }),
    idempotencyKey: z
      .string({ error: "This checkout could not be started. Please refresh the page and try again." })
      .trim()
      .min(8, "This checkout could not be started. Please refresh the page and try again.")
      .max(128, "This checkout could not be started. Please refresh the page and try again."),
  })
  .superRefine((value, ctx) => {
    if (value.contact.phone && !isValidPhone(value.contact.phone, value.address.country)) {
      ctx.addIssue({
        code: "custom",
        path: ["contact", "phone"],
        message: phoneErrorMessage(value.address.country),
      });
    }

    value.items.forEach((line, index) => {
      const product = getProductBySlug(line.slug);
      if (!product) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "slug"],
          message: "One of the pieces in your cart is no longer in our collection.",
        });
        return;
      }

      if (product.availability === "out_of_stock") {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "slug"],
          message: `${product.name} has sold out. Please remove it to place your order.`,
        });
        return;
      }

      const stitching = line.stitching as StitchingOption;
      if (!product.stitching.includes(stitching)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "stitching"],
          message: `${product.name} is not available with that stitching.`,
        });
        return;
      }

      if (stitching === "standard") {
        if (!line.size) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "size"],
            message: `Please choose a size for ${product.name}.`,
          });
          return;
        }
        if (!standardSizes.includes(line.size)) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "size"],
            message: "That size is not one we make.",
          });
          return;
        }
      }

      if (stitching === "custom") {
        const measurements = line.measurements as Measurements | undefined;
        if (!measurements) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "measurements"],
            message: `Please add your measurements for ${product.name}.`,
          });
          return;
        }

        const keys = measurementFields.map((field) => field.key);
        const values = Object.fromEntries(
          keys.map((key) => [key, String(measurements[key])])
        ) as Record<MeasurementKey, string>;
        const check = validateMeasurements(values, measurements.unit);

        if (!check.valid) {
          const firstField = keys.find((key) => check.errors[key]);
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "measurements"],
            message:
              (firstField ? check.errors[firstField] : undefined) ??
              "Those measurements do not look right.",
          });
          return;
        }
      }
    });
  });

/* ------------------------------------------------------------------ *
 * Validation entry points
 * ------------------------------------------------------------------ */

/**
 * Check everything the checkout form sent.
 *
 * Returns the cleaned-up input when it is all good, and a field-addressable
 * list of messages when it is not. The messages are written for customers,
 * so they can be shown as they are.
 */
export function validateCheckoutInput(raw: unknown): CheckoutValidation {
  const parsed = checkoutSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const value = parsed.data;

  return {
    valid: true,
    value: {
      ...value,
      deliveryNote: value.deliveryNote ?? "",
      items: value.items as CartLineInput[],
    },
  };
}

/** The messages for a list of issues, keyed by field. */
export function issuesByField(issues: CheckoutIssue[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const issue of issues) {
    if (!map[issue.field]) map[issue.field] = issue.message;
  }

  return map;
}

/**
 * The first issue in the order the customer sees. `items.3.size` counts as
 * the "items" field, because all cart problems are shown in that section.
 */
export function firstCheckoutIssue(
  issues: CheckoutIssue[]
): CheckoutIssue | undefined {
  const byField = issuesByField(issues);

  for (const field of CHECKOUT_FIELD_ORDER) {
    const exact = byField[field];
    if (exact) return { field, message: exact };

    const nested = issues.find(
      (issue) => issue.field.startsWith(`${field}.`) || issue.field.startsWith(`${field}[`)
    );
    if (nested) return { field, message: nested.message };
  }

  return issues[0];
}

/** The measurements fields, re-exported so the form and the rules agree. */
export { measurementFields };

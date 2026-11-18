/**
 * Checkout regression checks.
 *
 * These use the exact same shared schema and pricing module as the form and
 * /api/checkout, so a pass here means the browser and server agree. Run with:
 *
 *   npm run test:checkout
 */

import assert from "node:assert/strict";
import {
  firstCheckoutIssue,
  isValidPhone,
  validateCheckoutInput,
  type CheckoutInput,
} from "../src/lib/checkout-validation";
import { countryCurrency, SHIPPING_COUNTRIES } from "../src/lib/countries";
import { priceCart } from "../src/lib/pricing";
import { multiBuyDiscount, MULTI_BUY_DISCOUNT_REF } from "../src/lib/offers";
import { products } from "../src/lib/products";

const product = products.find(
  (item) => item.availability !== "out_of_stock" && item.stitching.includes("standard")
);

assert.ok(product, "The catalogue needs at least one orderable standard-stitch piece.");

const validOrder: CheckoutInput = {
  contact: {
    name: "Test Customer",
    email: "test.customer@example.com",
    phone: "+92 300 1234567",
  },
  address: {
    line1: "123 Test Street",
    city: "Lahore",
    country: "PK",
  },
  deliveryNote: "",
  termsAccepted: true,
  items: [
    {
      slug: product.slug,
      quantity: 2,
      stitching: "standard",
      size: "M",
    },
  ],
  paymentMethod: "cod",
  idempotencyKey: "checkout-test-valid-0001",
};

type Case = {
  field: string;
  order: CheckoutInput;
  expected: "pass" | "fail";
  expectedField?: string;
};

function withChange(change: (order: CheckoutInput) => void): CheckoutInput {
  const copy = structuredClone(validOrder);
  change(copy);
  return copy;
}

const emptyCases: Case[] = [
  { field: "contact.name", expected: "fail", expectedField: "contact.name", order: withChange((o) => { o.contact.name = ""; }) },
  { field: "contact.email", expected: "fail", expectedField: "contact.email", order: withChange((o) => { o.contact.email = ""; }) },
  { field: "contact.phone", expected: "fail", expectedField: "contact.phone", order: withChange((o) => { o.contact.phone = ""; }) },
  { field: "address.line1", expected: "fail", expectedField: "address.line1", order: withChange((o) => { o.address.line1 = ""; }) },
  { field: "address.city", expected: "fail", expectedField: "address.city", order: withChange((o) => { o.address.city = ""; }) },
  { field: "address.country", expected: "fail", expectedField: "address.country", order: withChange((o) => { o.address.country = ""; }) },
  { field: "address.line2 (optional)", expected: "pass", order: withChange((o) => { o.address.line2 = ""; }) },
  { field: "address.state (optional)", expected: "pass", order: withChange((o) => { o.address.state = ""; }) },
  { field: "address.postalCode (optional)", expected: "pass", order: withChange((o) => { o.address.postalCode = ""; }) },
  { field: "deliveryNote (optional)", expected: "pass", order: withChange((o) => { o.deliveryNote = ""; }) },
  { field: "termsAccepted", expected: "fail", expectedField: "termsAccepted", order: withChange((o) => { o.termsAccepted = false; }) },
  { field: "paymentMethod", expected: "fail", expectedField: "paymentMethod", order: withChange((o) => { (o as unknown as Record<string, unknown>).paymentMethod = ""; }) },
  { field: "items", expected: "fail", expectedField: "items", order: withChange((o) => { o.items = []; }) },
  { field: "idempotencyKey", expected: "fail", expectedField: "idempotencyKey", order: withChange((o) => { o.idempotencyKey = ""; }) },
];

console.log("Checkout regression checks\n");

/* 1. The full, valid order. -------------------------------------------- */
const valid = validateCheckoutInput(validOrder);
assert.equal(valid.valid, true, JSON.stringify(valid.valid ? null : valid.issues));
console.log("Full valid order: PASS");

const priced = priceCart(validOrder.items);
assert.equal(priced.ok, true);
if (priced.ok) {
  const expectedDiscount = Math.round(priced.order.subtotal * 0.1);
  assert.equal(priced.order.discount, expectedDiscount);
  assert.equal(priced.order.discountCode, MULTI_BUY_DISCOUNT_REF);
  assert.equal(priced.order.total, priced.order.subtotal - expectedDiscount);
  console.table([
    {
      case: "2 dresses (buy-2 offer)",
      subtotal: priced.order.subtotal,
      discount: priced.order.discount,
      discountLine: `-${MULTI_BUY_DISCOUNT_REF} (10% automatic)`,
      total: priced.order.total,
      currency: priced.order.currency,
    },
  ]);

  // The live offer is "buy 2, get extra 10% off". It is automatic: there is
  // no code to type, so a code cannot stack on it or replace it.
  for (const quantity of [1, 2, 3]) {
    const result = priceCart([{ ...validOrder.items[0], quantity }]);
    assert.equal(result.ok, true);
    if (!result.ok) continue;

    const expected = quantity >= 2 ? Math.round(result.order.subtotal * 0.1) : 0;
    assert.equal(result.order.discount, expected, `${quantity} item(s)`);
    assert.equal(
      result.order.discountCode,
      quantity >= 2 ? MULTI_BUY_DISCOUNT_REF : "",
      `${quantity} item(s)`
    );
    assert.equal(result.order.total, result.order.subtotal - expected);
  }
  console.log("Buy-2 discount: none for 1, 10% for 2, 10% for 3: PASS");

  // A negative or zero subtotal must never produce a negative discount. This
  // is the floor that protects the order total if the catalogue is ever
  // misconfigured.
  const floorCases = [
    { subtotal: -500, items: 2, expected: 0 },
    { subtotal: 0, items: 2, expected: 0 },
    { subtotal: 1, items: 2, expected: 0 },
    { subtotal: 100, items: 1, expected: 0 },
  ];

  for (const testCase of floorCases) {
    const actual = multiBuyDiscount(testCase.subtotal, testCase.items);
    assert.equal(actual, testCase.expected, JSON.stringify(testCase));
    assert.ok(actual >= 0, `Discount is never negative: ${JSON.stringify(testCase)}`);
  }
  console.log("Buy-2 discount floor: never negative, never below zero: PASS\n");
}

/* 2. Every field, emptied in turn. ------------------------------------- */
const emptyResults: Record<string, string> = {};

for (const testCase of emptyCases) {
  const result = validateCheckoutInput(testCase.order);
  const passed = result.valid === (testCase.expected === "pass");
  assert.ok(passed, `${testCase.field}: expected ${testCase.expected}, got ${JSON.stringify(result)}`);

  if (!result.valid && testCase.expectedField) {
    const first = firstCheckoutIssue(result.issues);
    assert.equal(
      first?.field,
      testCase.expectedField,
      `${testCase.field}: first issue was ${first?.field} (${first?.message})`
    );
    emptyResults[testCase.field] = `FAIL → ${first?.field}: ${first?.message}`;
  } else {
    emptyResults[testCase.field] = "PASS (empty is allowed)";
  }
}

console.log("Each field emptied:\n");
console.table(
  Object.entries(emptyResults).map(([field, result]) => ({ field, result }))
);

/* 3. Phone formats. ---------------------------------------------------- */
const phoneCases: { value: string; country: string; expected: boolean }[] = [
  { value: "0300 1234567", country: "PK", expected: true },
  { value: "+92 300 1234567", country: "PK", expected: true },
  { value: "0092 300 1234567", country: "PK", expected: true },
  { value: "07700 900123", country: "GB", expected: true },
  { value: "+44 7700 900123", country: "GB", expected: true },
  { value: "+1 (555) 123-4567", country: "US", expected: true },
  { value: "+61 2 9374 4000", country: "AU", expected: true },
  { value: "0044 7700 900123", country: "GB", expected: true },
  { value: "12345", country: "PK", expected: false },
  { value: "555 123 4567", country: "US", expected: false },
  { value: "0800 hands", country: "GB", expected: false },
];

const phoneResults = phoneCases.map((testCase) => {
  const actual = isValidPhone(testCase.value, testCase.country);
  assert.equal(actual, testCase.expected, `${testCase.value} (${testCase.country})`);
  return {
    number: testCase.value,
    country: testCase.country,
    result: actual ? "accepted" : "rejected",
  };
});

console.log("Phone formats:\n");
console.table(phoneResults);

/* 4. Country list and currency agreement. ------------------------------ */
const countryPhones: Record<string, string> = {
  US: "+1 555 1234567",
  DE: "+49 30 901820",
  FR: "+33 1 42 68 53 00",
  GB: "+44 7700 900123",
  CA: "+1 416 555 0123",
  AU: "+61 2 9374 4000",
  PK: "+92 300 1234567",
  JP: "+81 3 1234 5678",
  AE: "+971 50 123 4567",
};

const checkedCountries = SHIPPING_COUNTRIES.filter((country) =>
  ["US", "DE", "FR", "GB", "CA", "AU", "PK", "JP", "AE"].includes(country.code)
);

for (const country of checkedCountries) {
  const result = validateCheckoutInput(
    withChange((o) => {
      o.address.country = country.code;
      o.contact.phone = countryPhones[country.code] ?? "+1 555 1234567";
    })
  );
  assert.equal(result.valid, true, `${country.code} should be a shipping country`);
  assert.equal(countryCurrency(country.code), country.currency);
}

assert.ok(SHIPPING_COUNTRIES.length >= 200, "Shipping list should cover 200+ countries");

const unknownCountry = validateCheckoutInput(
  withChange((o) => { o.address.country = "ZZ"; })
);
assert.equal(unknownCountry.valid, false);
assert.equal(firstCheckoutIssue(unknownCountry.issues)?.field, "address.country");

const ukAlias = validateCheckoutInput(
  withChange((o) => {
    o.address.country = "UK";
    o.contact.phone = "+44 7700 900123";
  })
);
assert.equal(ukAlias.valid, true, "UK alias should normalize to GB");

console.log(`Shipping countries accepted: ${SHIPPING_COUNTRIES.length}`);
console.table(
  checkedCountries.map((country) => ({
    code: country.code,
    name: country.name,
    currency: countryCurrency(country.code),
    checkout: "accepted",
  }))
);
console.log("Unknown country ZZ: rejected as address.country");
console.log("UK alias: accepted and normalized\n");
console.log("All checkout regression checks passed.");

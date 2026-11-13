# Premium Pakistani Dresses — Next.js

A complete e-commerce storefront built with **Next.js 16** (App Router, React 19, TypeScript), matching the Premium Pakistani Dresses design. Fully responsive, animated, cart & wishlist support.

## Folder Structure

```
dress-store/
├── public/                 <- Static assets served by Next.js at /
│   └── images/             <- Product photos (dress-1..8.jpg), referenced by src/data/products.ts
│
├── src/
│   ├── app/                <- App Router: one folder per route
│   │   ├── layout.tsx      <-    Root layout (Header, Footer, chrome components)
│   │   ├── page.tsx        <-    Home page (/)
│   │   ├── globals.css     <-    ALL styles (theme variables, layout, animations)
│   │   ├── favicon.ico     <-    Site icon (auto-served by Next.js)
│   │   ├── shop/           <-    /shop        (filters & sorting)
│   │   ├── collections/    <-    /collections
│   │   ├── products/[slug]/<-    /products/<product-slug> (detail + add-to-cart)
│   │   ├── cart/ checkout/ wishlist/ account/
│   │   ├── order/            <- /order/<order number> (the confirmation page)
│   │   │   └── lookup/      <-    /order/lookup (order number + email)
│   │   ├── api/              <- The server endpoints
│   │   │   ├── checkout/     <-    /api/checkout and /api/checkout/pay
│   │   │   ├── orders/       <-    /api/orders/lookup
│   │   │   ├── newsletter/   <-    sign up, confirm, unsubscribe
│   │   │   └── webhooks/     <-    /api/webhooks/stripe (marks orders paid)
│   │   ├── reviews/ contact/ shipping/ returns/ privacy/ terms/
│   │   ├── admin/            <- /admin — the order screens, behind a sign-in
│   │   │   ├── login/        <-    /admin/login (the sign-in page)
│   │   │   └── (protected)/  <-    /admin/orders and /admin/orders/<id>
│   │
│   │
│   ├── components/         <- Shared React components (Header, Footer, ProductCard,
│   │                          HeroSlider, QuickViewModal, SearchOverlay, …)
│   ├── context/            <- CartContext.tsx: cart & wishlist state (localStorage)
│   ├── hooks/              <- useHydrated.ts (knows when the browser has taken over)
│   ├── lib/                <- ⭐ THE BUSINESS RULES
│   │   ├── products.ts     <-    The catalogue: pieces, prices, stitching, measurements
│   │   ├── discounts.ts    <-    The discount codes
│   │   ├── orders.ts       <-    Orders: creating them, paying them, finding them
│   │   ├── pricing.ts      <-    What an order costs (server-authoritative)
│   │   ├── checkout-validation.ts <- The checkout rules, shared by browser and server
│   │   ├── payments.ts     <-    Stripe Checkout and cash on delivery
│   │   ├── email.ts        <-    Resend: the order and newsletter messages
│   │   ├── newsletter.ts   <-    The mailing list (double opt-in)
│   │   └── rate-limit.ts   <-    The brakes on the write endpoints
│   │
│   └── data/               <- ⭐ ALL SITE CONTENT
│       ├── products.ts     <-    Product catalog
│       └── site.ts         <-    Site config, nav, hero slides, occasions, reviews…
│
├── _archive/
│   └── static-site/        <- The original HTML/CSS/JS version (kept for reference,
│                              not used by the Next.js app)
│       ├── *.html          <-    14 static pages
│       ├── css/style.css   <-    Old stylesheet
│       ├── js/             <-    Old data.js / layout.js / main.js
│       └── server.js       <-    Old zero-dependency preview server (port 8000)
│
├── next.config.ts          <- Next.js config (dev runs --webpack; see comments)
├── tsconfig.json           <- TypeScript config ("@/*" -> "./src/*")
├── eslint.config.mjs       <- Lint config
└── package.json
```

## How to Run

```powershell
npm install
npm run dev        # dev server → http://localhost:3000
```

Other scripts:

```powershell
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
```

> **Note for this machine:** `npm run dev` intentionally uses `next dev --webpack`
> (not Turbopack) because the ReasonLabs antivirus locks `.next` files mid-write,
> which breaks Turbopack dev. The webpack on-disk cache is also disabled because
> this machine has ~4 GB RAM. Do not "fix" this back to plain `next dev`.

## The Admin Area

`/admin` holds the order screens: the list (`/admin/orders`) and one order
(`/admin/orders/<id>`), with the actions that go with an order — change the
status, add a tracking number, mark a cash-on-delivery order as paid, cancel
it and keep notes on it. Every action is a server action that re-checks the
sign-in and checks what it is given, and every status change is written to
the order's history with the time it happened.

The sign-in is a signed cookie. Three environment variables run it:

| Variable | What it is |
|---|---|
| `ADMIN_EMAIL` | The address the studio signs in with |
| `ADMIN_PASSWORD` | The password for that address |
| `ADMIN_SESSION_SECRET` | A long random string that signs the session cookie |

Copy `.env.example` to `.env.local` and fill them in. Without them a
development machine falls back to a clearly marked development sign-in
(`admin@storestudio.local` / `admin-dev`) and a production server signs
nobody in at all.

The orders themselves live in `.data/orders.json` — the same JSON-file store
the reviews use, so there is no database to run. Card details are never
stored there: a payment is a method, a state and the provider's reference.

## Checkout, Payments & Emails

The checkout at `/checkout` is a real guest checkout: contact details, the
shipping address, the delivery note and a terms box, with every piece shown
with its stitching and its measurements. The same rules check the form in the
browser and again on the server (`src/lib/checkout-validation.ts`), and the
money is always worked out on the server from the catalogue
(`src/lib/pricing.ts`) — a price sent by the browser is never used.

An order is written down **before** the customer is sent to pay, and the
order number comes back with it. Placing the same order twice is safe: the
browser sends a key with the order, and the same key always gives the same
order back rather than a second one.

Payments live in one file, `src/lib/payments.ts`, so the provider can be
swapped: today it is Stripe Checkout (a hosted page — no card data ever
touches this shop) and cash on delivery, which is switched on and off with
`COD_ENABLED`. **An order is only ever marked as paid by the webhook**
(`/api/webhooks/stripe`), never by the page the customer lands on after
paying, and the webhook is safe to receive the same event twice.

Emails go out through Resend (`src/lib/email.ts`): the customer gets their
order confirmation, the studio gets a new-order notice, and both carry the
order number and the full summary — every piece, its stitching and its
measurements.

The order is at `/order/<order number>`, and it can be looked up at
`/order/lookup` with the order number **and** the email address it was
placed with. Neither one on its own shows anything.

| Variable | What it is |
|---|---|
| `STRIPE_SECRET_KEY` | The Stripe secret key. Without it the shop takes cash on delivery only |
| `STRIPE_WEBHOOK_SECRET` | The webhook's signing secret — without it no card order can be marked paid |
| `PAYMENT_CURRENCY` | The currency the card is charged in when the visitor's own is not one Stripe takes (default `USD`) |
| `COD_ENABLED` | `true` or `false` — cash on delivery is on unless this says otherwise |
| `RESEND_API_KEY` | The Resend API key. Without it orders still go through and the messages are printed to the terminal |
| `EMAIL_FROM` | The address the shop sends from |
| `ORDER_NOTICE_EMAIL` | Where new-order notices go (default: the address in `src/data/site.ts`) |
| `STORE_URL` | The address of the shop, used for the links in the emails |
| `NEWSLETTER_SECRET` | Signs the newsletter's confirmation and unsubscribe links — required in production |
| `NEXT_PUBLIC_ANALYTICS_SRC` | The script the cookie banner loads, and only once the visitor has accepted |

Two packages are needed for the payments and the email; they are not in
`package.json` yet, so run:

```powershell
npm install stripe resend
```

The newsletter is a double opt-in: the address is saved as *pending* and only
joins the list when the customer clicks the link in the confirmation email.
The form carries a hidden field that people never see and bots fill in, and
every newsletter carries a one-click unsubscribe link.

## Where to Edit What

| I want to change… | Edit this file |
|---|---|
| Products (add/remove/edit) | `src/data/products.ts` |
| Site name, email, phone, promo code, nav menu | `src/data/site.ts` |
| Hero slides, occasions, categories, reviews | `src/data/site.ts` |
| Colors, fonts, spacing, animations | `src/app/globals.css` (`:root` variables) |
| Header / footer / shared UI | `src/components/` |
| Page layouts | `src/app/<page>/page.tsx` |
| Product images | Drop files in `public/images/`, reference from `src/data/products.ts` |

## Tech Stack

- Next.js 16.4.2 (App Router, Cache Components)
- React 19.3.0
- TypeScript
- Plain CSS with theme variables (no Tailwind in the site design)

## Notes

- Cart & wishlist persist in the visitor's `localStorage` (`ppd_cart`, `ppd_wishlist`) via React Context. For a multi-user store, connect a database + backend.
- The checkout, the payment webhook and the emails are live — see "Checkout, Payments & Emails" above for the keys they need.
- Rate limits (checkout, order lookup, reviews, newsletter) are counted in the memory of one server. Spread the shop over several servers and they need a shared store such as Redis.
- The cookie banner is a fixed overlay: it never pushes the page down and never locks the scroll, and no analytics is loaded until the visitor accepts.

© 2026 Premium Pakistani Dresses

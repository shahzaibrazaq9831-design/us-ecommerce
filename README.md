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
│   │   ├── reviews/ contact/ shipping/ returns/ privacy/ terms/
│   │
│   ├── components/         <- Shared React components (Header, Footer, ProductCard,
│   │                          HeroSlider, QuickViewModal, SearchOverlay, …)
│   ├── context/            <- CartContext.tsx: cart & wishlist state (localStorage)
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
- The checkout is a front-end demo; integrate Stripe/PayPal in `src/app/checkout/` to accept real payments.

© 2026 Premium Pakistani Dresses

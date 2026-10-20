# Premium Pakistani Dresses - Next.js

A complete, working e-commerce website built with Next.js 16 (App Router, TypeScript), matching the Premium Pakistani Dresses design.

## Features

- **15 routes**: Home, Shop, Collections, Product detail, Cart, Checkout, Wishlist, Account, Reviews, Contact, Shipping, Returns, Privacy, Terms
- **Cart & Wishlist**: Persisted in `localStorage` (`ppd_cart`, `ppd_wishlist`) via React Context
- **Product catalog**: Dummy products in `src/data/products.ts` with `Product` type
- **Shared components**: Header, Footer, Announcement bar, ProductCard, Hero slider, Quick view modal, etc. in `src/components/`
- **Styling**: Global CSS in `app/globals.css` with the same gold/cream theme, responsive design
- **Images**: Optimized with `next/image` from `public/images/`
- **Navigation**: `next/link` for client-side navigation

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customization

### Add/Edit Products
Edit `src/data/products.ts`. Each product needs: `id`, `slug`, `name`, `category`, `price`, `originalPrice` (number | null), `image`, `badge` (optional), `rating`, `reviews`, `description`. Add images to `public/images/` and reference them.

### Update Site Content
Edit `src/data/site.ts` for site config, navigation, hero slides, occasions, categories, reviews, gallery, promo code.

### Update Styles
Edit `app/globals.css` - CSS variables in `:root` control colors, typography, spacing.

### Update Components
Components are in `src/components/`. Layout chrome is composed in `app/layout.tsx`.

## Tech Stack

- Next.js 16.4.2 (App Router)
- React 19.3.0
- TypeScript
- CSS (no Tailwind usage in the site design)

## Local Preview (Legacy)

The original HTML/CSS/JS files remain in the parent directory for reference. A simple Node server is available there (`server.js`).

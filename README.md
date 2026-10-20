<<<<<<< HEAD
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
=======
# Premium Pakistani Dresses — Website

A complete, production-ready e-commerce storefront for luxury Pakistani designer-inspired dresses, built to match the structure and feel of **premiumpakistanidresses.com**. Fully responsive, animated, and easy to customize.

---

## 🚀 How to Run

### Option 1: Open directly
Open `index.html` in your browser.

### Option 2: Local server (recommended)
A zero-dependency server is included. From the project folder, run:

```powershell
node server.js
```

Then visit **http://localhost:8000**

(Any static server works too, e.g. `npx serve .`.)

---

## 📁 Folder Structure

```
E:\us ecommerce\
│
├── index.html          → Home page (hero, occasions, best sellers, reviews…)
├── shop.html           → Shop All with filters & sorting
├── collections.html    → Shop by Occasion collection cards
├── product.html        → Single product detail page
├── cart.html           → Shopping cart
├── checkout.html       → Checkout / order summary
├── wishlist.html       → Saved items
├── account.html        → Sign in / create account
├── reviews.html        → Customer reviews
├── contact.html        → Contact form & support info
├── shipping.html       → Shipping policy
├── returns.html        → Refund & returns policy
├── privacy.html        → Privacy policy
├── terms.html          → Terms of service
├── favicon.svg         → Site icon
│
├── css/
│   └── style.css       → ALL styles (colors, layout, animations, responsive)
│
└── js/
    ├── data.js         → ⭐ ALL DATA (products, nav, config, reviews…)
    ├── layout.js       → ⭐ Shared header/footer renderer
    └── main.js         → ⭐ App logic (cart, wishlist, filters, sliders…)
```

---

## ⭐ How to Customize

Everything is driven by **one data file** and **one layout file**.

### Change a product
Open `js/data.js` → edit the `window.PRODUCTS` array:

```js
{ id: 9, name: "Your New Dress", category: "Formals", price: 159.99,
  originalPrice: null, image: "your-image.jpg", badge: "new",
  rating: 4.8, reviews: 10 }
```

Add a new one and it appears on the home page, shop page, wishlist and quick view automatically.

### Change colors
Open `css/style.css` → edit the `:root` variables:

```css
:root {
    --color-primary: #8B6914;   /* main brand color */
    --color-gold:    #D4AF37;   /* accents */
    --color-cream:   #FAF8F5;   /* section backgrounds */
}
```

### Change site name / email / phone / promo code
Open `js/data.js` → edit `window.SITE_CONFIG`:

```js
window.SITE_CONFIG = {
    name: "Your Store Name",
    email: "you@example.com",
    phone: "+1 000 000 0000",
    promoCode: "YOURCODE",
    ...
};
```

This updates the logo, announcement bar, footer and contact info across **every page**.

### Change navigation menu
Open `js/data.js` → edit `window.SITE_NAV`.

### Add / change occasion or category cards
Open `js/data.js` → edit `window.SITE_OCCASIONS` or `window.SITE_CATEGORIES`.

### Change reviews
Open `js/data.js` → edit `window.SITE_REVIEWS`.

---

## ✨ Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Animated hero slider with auto-play + touch swipe
- ✅ Product quick-view modal
- ✅ Add to cart / wishlist with live badge counters
- ✅ Cart & checkout pages (data persists in the browser)
- ✅ Shop filters (category, occasion, price, size, color) + sorting
- ✅ Scroll-reveal animations
- ✅ Sticky header, mobile slide-out menu, search bar
- ✅ Newsletter signup, WhatsApp floating button, back-to-top
- ✅ Consistent luxury gold/cream theme

---

## 🔌 Integrating Real Payments

The checkout is a front-end demo. To accept real payments:
1. Create a **Stripe** (or PayPal) account.
2. Replace the `placeOrder()` function in `checkout.html` with your payment provider's checkout code.
3. Connect a backend to create orders (Node/PHP/etc.).

---

## 📝 Notes

- Product and gallery images currently load from Unsplash. Replace with your own images placed in an `images/` folder and update the paths in `js/data.js`.
- Cart & wishlist are stored in the visitor's browser (localStorage). For a multi-user store, connect a database + backend.

© 2026 Premium Pakistani Dresses
>>>>>>> 86567592435da226366a00b64522a0dc054b9e17

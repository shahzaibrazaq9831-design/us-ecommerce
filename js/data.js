/**
 * ============================================
 * SITE DATA - Single source of truth
 * Edit this file to update products, config,
 * navigation, collections and reviews site-wide.
 * ============================================
 */

// --------------------------------------------
// Site Configuration
// --------------------------------------------
window.SITE_CONFIG = {
    name: "Premium Pakistani Dresses",
    tagline: "Luxury Designer-Inspired Dresses",
    company: "PPD GLOBAL LLC",
    email: "support@premiumpakistanidresses.com",
    phone: "+92 320 0909666",
    whatsapp: "https://wa.me/923200909666?text=Hello%20Premium%20Pakistani%20Dresses%2C%20I%20would%20like%20some%20styling%20assistance.",
    promoCode: "PPD10",
    promoDiscount: "10%",
    currency: "$",
    social: {
        instagram: "https://www.instagram.com/premium.pakistani.dresses/",
        threads: "https://www.threads.com/@premium.pakistani.dresses",
        facebook: "https://www.facebook.com/61592077179870",
        tiktok: "https://www.tiktok.com/@premiumpakistanidresses"
    }
};

// --------------------------------------------
// Main Navigation
// --------------------------------------------
window.SITE_NAV = [
    { label: "Shop All", href: "shop.html" },
    { label: "Best Sellers", href: "shop.html" },
    { label: "New Arrivals", href: "shop.html" },
    {
        label: "Occasions",
        href: "collections.html",
        children: [
            { label: "Barat", href: "collections.html" },
            { label: "Mehndi", href: "collections.html" },
            { label: "Nikkah", href: "collections.html" },
            { label: "Walima", href: "collections.html" },
            { label: "Mayun", href: "collections.html" },
            { label: "Dholki", href: "collections.html" },
            { label: "Engagement", href: "collections.html" },
            { label: "Eid", href: "collections.html" }
        ]
    },
    {
        label: "Wedding",
        href: "shop.html",
        children: [
            { label: "Bridal", href: "shop.html" },
            { label: "Wedding", href: "shop.html" }
        ]
    },
    { label: "Formals", href: "shop.html" },
    { label: "Chiffon", href: "shop.html" },
    {
        label: "Designers",
        href: "shop.html",
        children: [
            { label: "ETHNC", href: "shop.html" }
        ]
    },
    { label: "Reviews", href: "reviews.html" }
];

// --------------------------------------------
// Occasion Cards (Shop by Occasion section)
// --------------------------------------------
window.SITE_OCCASIONS = [
    { name: "Barat", href: "collections.html", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80" },
    { name: "Mehndi", href: "collections.html", image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80" },
    { name: "Nikkah", href: "collections.html", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80" },
    { name: "Walima", href: "collections.html", image: "https://images.unsplash.com/photo-1610030469668-935e6ba13d3c?w=600&q=80" },
    { name: "Mayun", href: "collections.html", image: "https://images.unsplash.com/photo-1606293459338-cd9b3c0fa8ba?w=600&q=80" },
    { name: "Dholki", href: "collections.html", image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80" },
    { name: "Engagement", href: "collections.html", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80" },
    { name: "Eid", href: "collections.html", image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80" }
];

// --------------------------------------------
// Categories
// --------------------------------------------
window.SITE_CATEGORIES = [
    { name: "Bridal Dresses", count: 24, href: "shop.html", image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80" },
    { name: "Wedding Dresses", count: 36, href: "shop.html", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80" },
    { name: "Formals", count: 48, href: "shop.html", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80" },
    { name: "Chiffon", count: 32, href: "shop.html", image: "https://images.unsplash.com/photo-1610030469668-935e6ba13d3c?w=800&q=80" }
];

// --------------------------------------------
// Products
// --------------------------------------------
window.PRODUCTS = [
    { id: 1, name: "Embroidered Chiffon Suit - Royal Blue", category: "Chiffon", price: 89.99, originalPrice: 119.99, image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80", badge: "bestseller", rating: 4.8, reviews: 124 },
    { id: 2, name: "Bridal Lehenga - Maroon Gold", category: "Bridal", price: 299.99, originalPrice: 399.99, image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80", badge: "sale", rating: 4.9, reviews: 89 },
    { id: 3, name: "Silk Formal Dress - Emerald Green", category: "Formals", price: 149.99, originalPrice: null, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80", badge: "new", rating: 4.7, reviews: 56 },
    { id: 4, name: "Anarkali Gown - Pastel Pink", category: "Formals", price: 129.99, originalPrice: 159.99, image: "https://images.unsplash.com/photo-1610030469668-935e6ba13d3c?w=600&q=80", badge: "sale", rating: 4.6, reviews: 78 },
    { id: 5, name: "Wedding Sharara - Ivory Gold", category: "Wedding", price: 249.99, originalPrice: null, image: "https://images.unsplash.com/photo-1606293459338-cd9b3c0fa8ba?w=600&q=80", badge: "new", rating: 4.9, reviews: 45 },
    { id: 6, name: "Mehndi Outfit - Mustard Yellow", category: "Mehndi", price: 99.99, originalPrice: 129.99, image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80", badge: "bestseller", rating: 4.8, reviews: 112 },
    { id: 7, name: "Nikkah Dress - White Silver", category: "Nikkah", price: 179.99, originalPrice: null, image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80", badge: "new", rating: 4.7, reviews: 34 },
    { id: 8, name: "Eid Collection - Teal Blue", category: "Eid", price: 119.99, originalPrice: 149.99, image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80", badge: "sale", rating: 4.5, reviews: 67 }
];

// --------------------------------------------
// Customer Reviews
// --------------------------------------------
window.SITE_REVIEWS = [
    { text: "Absolutely stunning dress! The quality exceeded my expectations and the stitching was perfect. Got so many compliments at my sister's wedding.", author: "Ayesha K.", initial: "A", rating: 5 },
    { text: "Ordered for my daughter's mehndi — the color was exactly as shown and delivery was faster than expected. Will definitely order again!", author: "Fatima R.", initial: "F", rating: 5 },
    { text: "Beautiful fabric and elegant design. The custom stitching option was a lifesaver. Customer service was very helpful throughout.", author: "Zainab M.", initial: "Z", rating: 4.5 }
];

// --------------------------------------------
// Instagram / Gallery
// --------------------------------------------
window.SITE_GALLERY = [
    "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&q=80",
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
    "https://images.unsplash.com/photo-1610030469668-935e6ba13d3c?w=400&q=80",
    "https://images.unsplash.com/photo-1606293459338-cd9b3c0fa8ba?w=400&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80"
];

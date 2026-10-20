/**
 * ============================================
 * MAIN APP LOGIC
 * Uses data from js/data.js and shared chrome
 * from js/layout.js. All product interactions
 * (cart, wishlist, quick view, hero, filters)
 * live here and work on every page.
 * ============================================
 */

// --------------------------------------------
// State (persisted in localStorage)
// --------------------------------------------
let cart = JSON.parse(localStorage.getItem('ppd_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('ppd_wishlist')) || [];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// --------------------------------------------
// Init
// --------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initOccasionsScroll();
    initProducts();
    initNewsletter();
    initBackToTop();
    initScrollAnimations();
    initSearch();
    initProductActions();
    updateCartCount();
    updateWishlistCount();
    initFilterSidebar();
    initQuickView();
});

// --------------------------------------------
// Product card builder
// --------------------------------------------
function createProductCard(product) {
    const badgeClass = product.badge === 'new' ? 'badge-new' :
        product.badge === 'sale' ? 'badge-sale' : 'badge-bestseller';
    const badgeText = product.badge === 'new' ? 'New' :
        product.badge === 'sale' ? 'Sale' : 'Best Seller';
    const priceHtml = product.originalPrice
        ? `<span class="price-current">$${product.price.toFixed(2)}</span><span class="price-original">$${product.originalPrice.toFixed(2)}</span>`
        : `<span class="price-current">$${product.price.toFixed(2)}</span>`;
    const inWishlist = wishlist.includes(product.id);

    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}" data-price="${product.price}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<span class="product-badge ${badgeClass}">${badgeText}</span>` : ''}
                <div class="product-actions">
                    <button class="product-action-btn wishlist-btn ${inWishlist ? 'active' : ''}" data-action="wishlist" data-id="${product.id}" aria-label="Add to wishlist"><i class="fas fa-heart"></i></button>
                    <button class="product-action-btn" data-action="quickview" data-id="${product.id}" aria-label="Quick view"><i class="fas fa-eye"></i></button>
                    <button class="product-action-btn" data-action="addtocart" data-id="${product.id}" aria-label="Add to cart"><i class="fas fa-shopping-bag"></i></button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${priceHtml}</div>
            </div>
        </div>
    `;
}

// --------------------------------------------
// Render products (home + shop)
// --------------------------------------------
function initProducts() {
    const P = window.PRODUCTS || [];

    // Home: Best Sellers + New Arrivals
    const bestGrid = $('#bestSellersGrid');
    if (bestGrid) bestGrid.innerHTML = P.slice(0, 4).map(createProductCard).join('');

    const newGrid = $('#newArrivalsGrid');
    if (newGrid) newGrid.innerHTML = P.slice(4, 8).map(createProductCard).join('');

    // Shop page grid
    const shopGrid = $('#shopProductsGrid');
    if (shopGrid) shopGrid.innerHTML = P.map(createProductCard).join('');

    // Wishlist page
    const wishGrid = $('#wishlistContainer');
    if (wishGrid) renderWishlistPage(wishGrid);
}

function renderWishlistPage(container) {
    const P = window.PRODUCTS || [];
    const items = P.filter(p => wishlist.includes(p.id));

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-wishlist">
                <i class="far fa-heart"></i>
                <h2>Your wishlist is empty</h2>
                <p>Save items you love to your wishlist and they'll appear here.</p>
                <a href="index.html" class="btn btn-primary">Start Shopping</a>
            </div>`;
        return;
    }

    container.innerHTML = `<div class="wishlist-grid">${items.map(createProductCard).join('')}</div>`;
}

// --------------------------------------------
// Global product action delegation
// --------------------------------------------
function initProductActions() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.product-action-btn');
        if (!btn) return;
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;

        if (action === 'addtocart') addToCart(id);
        else if (action === 'wishlist') toggleWishlist(id, btn);
        else if (action === 'quickview') openQuickView(id);
    });
}

// --------------------------------------------
// Cart
// --------------------------------------------
function addToCart(productId) {
    const product = (window.PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(i => i.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    saveCart();
    updateCartCount();
    showToast(`${product.name} added to cart`);
}

function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartCount();
    if ($('#cartContainer')) renderCartPage();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartCount();
    if ($('#cartContainer')) renderCartPage();
    showToast('Item removed from cart');
}

function saveCart() { localStorage.setItem('ppd_cart', JSON.stringify(cart)); }
function updateCartCount() {
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    const el = $('#cartCount');
    if (el) el.textContent = total;
}

function renderCartPage() {
    const container = $('#cartContainer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart" style="grid-column: 1 / -1;">
                <i class="fas fa-shopping-bag"></i>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <a href="index.html" class="btn btn-primary">Continue Shopping</a>
            </div>`;
        return;
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal; // free shipping

    container.innerHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
                    <div class="cart-item-details">
                        <span class="category">${item.category}</span>
                        <h3>${item.name}</h3>
                        <div class="price">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="remove-btn" onclick="removeItem(${item.id})"><i class="fas fa-trash"></i></button>
                        <div class="quantity-control">
                            <button onclick="updateQuantity(${item.id}, -1)">−</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                </div>`).join('')}
        </div>
        <div class="cart-summary">
            <h2>Order Summary</h2>
            <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
            <div class="summary-row"><span>Shipping</span><span style="color: var(--color-success);">Free</span></div>
            <div class="promo-code">
                <input type="text" placeholder="Promo code" id="promoInput">
                <button onclick="applyPromo()">Apply</button>
            </div>
            <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
            <button class="btn btn-primary checkout-btn" onclick="checkout()">Proceed to Checkout</button>
            <a href="index.html" style="display:block; text-align:center; margin-top:16px; color:var(--color-gray-600); font-size:0.9rem;">Continue Shopping</a>
        </div>`;
}

function applyPromo() {
    const code = ($('#promoInput')?.value || '').trim().toUpperCase();
    showToast(code === 'PPD10' ? 'Promo code applied! 10% discount' : 'Invalid promo code');
}

function checkout() {
    showToast('Checkout — integrate your payment gateway here');
}

// --------------------------------------------
// Wishlist
// --------------------------------------------
function toggleWishlist(productId, btn) {
    const product = (window.PRODUCTS || []).find(p => p.id === productId);
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        if (btn) btn.classList.remove('active');
        showToast(`${product?.name || 'Item'} removed from wishlist`);
    } else {
        wishlist.push(productId);
        if (btn) btn.classList.add('active');
        showToast(`${product?.name || 'Item'} added to wishlist`);
    }
    saveWishlist();
    updateWishlistCount();
    if ($('#wishlistContainer')) renderWishlistPage($('#wishlistContainer'));
}

function saveWishlist() { localStorage.setItem('ppd_wishlist', JSON.stringify(wishlist)); }
function updateWishlistCount() {
    const el = $('#wishlistCount');
    if (el) el.textContent = wishlist.length;
}

// --------------------------------------------
// Quick View
// --------------------------------------------
function initQuickView() { /* events bound in layout; content here */ }

function openQuickView(productId) {
    const product = (window.PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;
    const modal = $('#quickViewModal');
    const body = $('#modalBody');
    if (!modal || !body) return;

    const inWishlist = wishlist.includes(product.id);
    body.innerHTML = `
        <div class="quick-view-grid">
            <div class="quick-view-image"><img src="${product.image}" alt="${product.name}"></div>
            <div class="quick-view-info">
                <span class="product-category">${product.category}</span>
                <h2>${product.name}</h2>
                <div class="review-stars">${getStars(product.rating)}<span style="margin-left:8px;font-size:0.85rem;color:var(--color-gray-600);">(${product.reviews || 0} reviews)</span></div>
                <div class="product-price" style="margin:16px 0;">
                    <span class="price-current" style="font-size:1.5rem;">$${product.price.toFixed(2)}</span>
                    ${product.originalPrice ? `<span class="price-original" style="font-size:1.1rem;">$${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <p style="color:var(--color-gray-600); margin-bottom:24px; line-height:1.7;">
                    Exquisitely crafted with premium materials. This stunning piece features intricate detailing
                    and a flattering silhouette perfect for any special occasion. Available in unstitched form
                    with optional custom stitching.
                </p>
                <div style="display:flex; gap:12px; margin-bottom:16px;">
                    <button class="btn btn-primary" style="flex:1;" onclick="addToCart(${product.id}); window.layoutHelpers.closeQuickView();">
                        <i class="fas fa-shopping-bag"></i> Add to Cart
                    </button>
                    <button class="product-action-btn ${inWishlist ? 'active' : ''}" style="width:50px; height:50px; border:1px solid var(--color-gray-300);" onclick="toggleWishlist(${product.id}, this)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div style="padding-top:16px; border-top:1px solid var(--color-gray-200);">
                    <p style="font-size:0.85rem; color:var(--color-gray-600);"><i class="fas fa-shipping-fast" style="color:var(--color-success); margin-right:8px;"></i>Free Worldwide Shipping</p>
                    <p style="font-size:0.85rem; color:var(--color-gray-600); margin-top:8px;"><i class="fas fa-undo-alt" style="color:var(--color-success); margin-right:8px;"></i>7-Day Easy Returns</p>
                </div>
            </div>
        </div>`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function getStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) stars += '<i class="fas fa-star"></i>';
        else if (i === Math.ceil(rating) && rating % 1 !== 0) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// --------------------------------------------
// Hero Slider
// --------------------------------------------
function initHeroSlider() {
    const slider = $('#heroSlider');
    if (!slider) return;
    const slides = $$('.hero-slide', slider);
    const dots = $$('.dot', $('#heroDots'));
    if (!slides.length) return;
    let current = 0, timer;

    function go(i) {
        slides[current].classList.remove('active');
        dots[current]?.classList.remove('active');
        current = (i + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current]?.classList.add('active');
    }
    function next() { go(current + 1); }
    function start() { timer = setInterval(next, 5000); }
    function reset() { clearInterval(timer); start(); }

    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); reset(); }));

    let startX = 0;
    slider.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX);
    slider.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) { diff > 0 ? go(current + 1) : go(current - 1); reset(); }
    });

    start();
}

// --------------------------------------------
// Occasions scroll
// --------------------------------------------
function initOccasionsScroll() {
    const grid = $('#occasionsGrid');
    if (!grid) return;
    const amount = 220;
    $('#occasionLeft')?.addEventListener('click', () => grid.scrollBy({ left: -amount, behavior: 'smooth' }));
    $('#occasionRight')?.addEventListener('click', () => grid.scrollBy({ left: amount, behavior: 'smooth' }));
}

// --------------------------------------------
// Search
// --------------------------------------------
function initSearch() {
    const input = $('#searchInput');
    if (!input) return;
    input.addEventListener('input', debounce((e) => {
        const q = e.target.value.toLowerCase().trim();
        $$('.product-card').forEach(card => {
            const name = (card.querySelector('.product-name')?.textContent || '').toLowerCase();
            const cat = (card.querySelector('.product-category')?.textContent || '').toLowerCase();
            card.style.display = (q === '' || name.includes(q) || cat.includes(q)) ? '' : 'none';
        });
    }, 200));
}

// --------------------------------------------
// Shop filters + sort
// --------------------------------------------
function initFilterSidebar() {
    if (!$('#shopProductsGrid')) return;
    const P = window.PRODUCTS || [];

    function render(items) {
        const grid = $('#shopProductsGrid');
        const count = $('#resultsCount');
        if (count) count.textContent = `Showing ${items.length} products`;
        if (items.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <i class="fas fa-search" style="font-size:3rem;color:var(--color-gray-300);margin-bottom:16px;"></i>
                <h3 style="font-family:var(--font-heading);">No products found</h3>
                <p style="color:var(--color-gray-600);">Try adjusting your filters</p></div>`;
            return;
        }
        grid.innerHTML = items.map(createProductCard).join('');
    }

    $$('.filter-check').forEach(check => check.addEventListener('change', () => {
        let filtered = [...P];
        $$('.filter-check:checked').forEach(c => {
            const f = c.dataset.filter, v = c.value;
            if (f === 'category') filtered = filtered.filter(p => p.category.toLowerCase() === v.toLowerCase());
            else if (f === 'price') {
                const [min, max] = v.split('-').map(Number);
                filtered = filtered.filter(p => p.price >= min && p.price <= max);
            }
        });
        render(filtered);
    }));

    $('#sortSelect')?.addEventListener('change', (e) => {
        const sort = e.target.value;
        let sorted = [...P];
        if (sort === 'price-low') sorted.sort((a, b) => a.price - b.price);
        else if (sort === 'price-high') sorted.sort((a, b) => b.price - a.price);
        else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
        render(sorted);
    });

    document.querySelectorAll('.filter-group h4').forEach(h => {
        h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });
}

// --------------------------------------------
// Newsletter
// --------------------------------------------
function initNewsletter() {
    const form = $('#newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Thank you for subscribing! Check your email for the discount code.');
        form.reset();
    });
}

// --------------------------------------------
// Back to top
// --------------------------------------------
function initBackToTop() {
    const btn = $('#backToTop');
    if (!btn) return;
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// --------------------------------------------
// Scroll animations
// --------------------------------------------
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    $$('.section-header, .product-card, .feature-item, .occasion-card, .category-card, .review-card, .instagram-item')
        .forEach(el => { el.classList.add('scroll-animate'); observer.observe(el); });
}

// --------------------------------------------
// Toast
// --------------------------------------------
function showToast(message) {
    const toast = $('#toast');
    const msg = $('#toastMessage');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

// --------------------------------------------
// Utilities
// --------------------------------------------
function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// Expose for inline handlers
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.applyPromo = applyPromo;
window.checkout = checkout;

/**
 * ============================================
 * SHARED LAYOUT RENDERER
 * Renders the header, footer and floating
 * elements on every page from a single place.
 * Add <div id="site-announcement"></div>
 *     <div id="site-header"></div>
 *     <div id="site-footer"></div>
 * to any page and it will be filled in here.
 * ============================================
 */

(function () {
    const config = window.SITE_CONFIG || {};
    const nav = window.SITE_NAV || [];
    const current = document.body.dataset.page || '';

    // ---------- Announcement Bar ----------
    function renderAnnouncement() {
        const el = document.getElementById('site-announcement');
        if (!el) return;
        const promo = config.promoCode ? `Use code <strong>${config.promoCode}</strong> for ${config.promoDiscount} discount at checkout` : '';
        const single = `<span>Free Worldwide Delivery</span><span class="announcement-separator">•</span><span>${promo}</span><span class="announcement-separator">•</span>`;
        el.className = 'announcement-bar';
        el.innerHTML = `<div class="announcement-track">${single}${single}</div>`;
    }

    // ---------- Header ----------
    function renderHeader() {
        const el = document.getElementById('site-header');
        if (!el) return;

        const navItems = nav.map(item => {
            const isActive = item.href && item.href === current ? ' class="active"' : '';
            if (item.children && item.children.length) {
                const children = item.children
                    .map(c => `<li><a href="${c.href}">${c.label}</a></li>`)
                    .join('');
                return `<li class="nav-dropdown"${isActive}>
                    <a href="${item.href}">${item.label} <i class="fas fa-chevron-down"></i></a>
                    <ul class="dropdown">${children}</ul>
                </li>`;
            }
            return `<li${isActive}><a href="${item.href}">${item.label}</a></li>`;
        }).join('');

        const mobileItems = nav.map(item =>
            `<li><a href="${item.href}">${item.label}</a></li>`
        ).join('');

        el.innerHTML = `
            <header class="header" id="header">
                <div class="header-top">
                    <button class="menu-toggle" id="menuToggle" aria-label="Open menu"><i class="fas fa-bars"></i></button>
                    <a href="index.html" class="logo">${config.name}</a>
                    <div class="header-actions">
                        <button class="header-icon" id="searchToggle" aria-label="Search"><i class="fas fa-search"></i></button>
                        <a href="account.html" class="header-icon" aria-label="Account"><i class="far fa-user"></i></a>
                        <a href="wishlist.html" class="header-icon" aria-label="Wishlist"><i class="far fa-heart"></i><span class="badge" id="wishlistCount">0</span></a>
                        <a href="cart.html" class="header-icon" aria-label="Shopping bag"><i class="fas fa-shopping-bag"></i><span class="badge" id="cartCount">0</span></a>
                    </div>
                </div>
                <nav class="main-nav" id="mainNav">
                    <ul class="nav-list">${navItems}</ul>
                </nav>
            </header>

            <div class="mobile-menu" id="mobileMenu">
                <div class="mobile-menu-header">
                    <span class="logo">${config.name}</span>
                    <button class="close-menu" id="closeMenu"><i class="fas fa-times"></i></button>
                </div>
                <ul class="mobile-nav-list">${mobileItems}</ul>
            </div>

            <div class="overlay" id="overlay"></div>

            <div class="search-bar" id="searchBar">
                <div class="search-container">
                    <input type="text" placeholder="Search for dresses, occasions, designers..." id="searchInput">
                    <button class="search-close" id="searchClose"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    }

    // ---------- Footer ----------
    function renderFooter() {
        const el = document.getElementById('site-footer');
        if (!el) return;
        const s = config.social || {};
        el.className = 'footer';
        el.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-col footer-brand">
                        <a href="index.html" class="logo">${config.name}</a>
                        <p>Bringing the finest Pakistani fashion to your doorstep, worldwide.</p>
                        <div class="social-links">
                            ${s.instagram ? `<a href="${s.instagram}" aria-label="Instagram"><i class="fab fa-instagram"></i></a>` : ''}
                            ${s.threads ? `<a href="${s.threads}" aria-label="Threads"><i class="fab fa-threads"></i></a>` : ''}
                            ${s.facebook ? `<a href="${s.facebook}" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>` : ''}
                            ${s.tiktok ? `<a href="${s.tiktok}" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>` : ''}
                        </div>
                    </div>
                    <div class="footer-col">
                        <h4>Shop</h4>
                        <ul>
                            <li><a href="shop.html">Shop All</a></li>
                            <li><a href="shop.html">Bridal Dresses</a></li>
                            <li><a href="shop.html">Wedding Dresses</a></li>
                            <li><a href="shop.html">Best Sellers</a></li>
                            <li><a href="shop.html">New Arrivals</a></li>
                            <li><a href="shop.html">Chiffon</a></li>
                            <li><a href="reviews.html">Customer Reviews</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Policies</h4>
                        <ul>
                            <li><a href="shipping.html">Product Disclosure</a></li>
                            <li><a href="shipping.html">Shipping</a></li>
                            <li><a href="returns.html">Refund Policy</a></li>
                            <li><a href="privacy.html">Privacy Policy</a></li>
                            <li><a href="terms.html">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Contact Us</h4>
                        <ul class="contact-list">
                            <li><strong>Company:</strong> ${config.company}</li>
                            <li><strong>Email:</strong> <a href="mailto:${config.email}">${config.email}</a></li>
                            <li><strong>Phone:</strong> <a href="tel:${config.phone.replace(/\s/g, '')}">${config.phone}</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} ${config.name}. All rights reserved.</p>
                    <div class="payment-icons">
                        <i class="fab fa-cc-visa"></i>
                        <i class="fab fa-cc-mastercard"></i>
                        <i class="fab fa-cc-amex"></i>
                        <i class="fab fa-cc-stripe"></i>
                    </div>
                </div>
            </div>
        `;
    }

    // ---------- Floating Elements ----------
    function renderFloating() {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <a href="${config.whatsapp || '#'}" class="whatsapp-float" target="_blank" aria-label="Chat on WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </a>
            <button class="back-to-top" id="backToTop" aria-label="Back to top">
                <i class="fas fa-chevron-up"></i>
            </button>
            <div class="toast" id="toast">
                <i class="fas fa-check-circle"></i>
                <span id="toastMessage">Item added to cart</span>
            </div>
            <div class="modal" id="quickViewModal">
                <div class="modal-overlay" id="modalOverlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="modalClose"><i class="fas fa-times"></i></button>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    // ---------- Wire up global events ----------
    function bindGlobalEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#menuToggle')) {
                document.getElementById('mobileMenu').classList.add('active');
                document.getElementById('overlay').classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            if (e.target.closest('#closeMenu')) closeMenu();
            if (e.target.id === 'overlay') closeMenu();
            if (e.target.closest('#searchToggle')) openSearch();
            if (e.target.closest('#searchClose')) closeSearch();
            if (e.target.closest('#backToTop')) window.scrollTo({ top: 0, behavior: 'smooth' });
            if (e.target.closest('#modalClose') || e.target.id === 'modalOverlay') closeQuickView();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMenu(); closeSearch(); closeQuickView();
            }
        });

        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (header) header.classList.toggle('scrolled', window.scrollY > 50);
            const btt = document.getElementById('backToTop');
            if (btt) btt.classList.toggle('visible', window.scrollY > 500);
        });
    }

    function closeMenu() {
        const m = document.getElementById('mobileMenu');
        if (!m) return;
        m.classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = '';
    }
    function openSearch() {
        const s = document.getElementById('searchBar');
        s.classList.add('active');
        document.getElementById('overlay').classList.add('active');
        document.getElementById('searchInput').focus();
    }
    function closeSearch() {
        const s = document.getElementById('searchBar');
        if (s) s.classList.remove('active');
    }
    function closeQuickView() {
        const m = document.getElementById('quickViewModal');
        if (!m) return;
        m.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Expose helpers
    window.layoutHelpers = { closeMenu, closeSearch, closeQuickView };

    // ---------- Render on load ----------
    document.addEventListener('DOMContentLoaded', () => {
        renderAnnouncement();
        renderHeader();
        renderFooter();
        renderFloating();
        bindGlobalEvents();
    });
})();

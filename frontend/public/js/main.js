// Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    console.log('Phadizon Loaded');

    // Check for logged-in user
    const user = JSON.parse(localStorage.getItem('user'));
    const userIcon = document.querySelector('.user-icon a');

    if (user && userIcon) {
        // If logged in, maybe change icon or link to profile/dashboard
        userIcon.href = 'dashboard.html'; // Assume dashboard exists or create it
        userIcon.innerHTML = `<i class="fa-solid fa-user-check" title="Logged in as ${user.name}"></i>`;
    }

    // Add Cart Animation/Logic Placeholder
    const cartBtn = document.querySelector('a[href="cart.html"]');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            // e.preventDefault();
            // Implement mini-cart or navigation
        });
    }

    // Setup Search Event Listeners
    const navSearchBtn = document.getElementById('navSearchBtn');
    const navSearchInput = document.getElementById('navSearchInput');
    const overlaySearchInput = document.getElementById('overlaySearchInput');
    
    if (navSearchBtn && navSearchInput) {
        navSearchBtn.addEventListener('click', () => handleSearch(navSearchInput.value));
        navSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(navSearchInput.value);
        });
    }

    if (overlaySearchInput) {
        overlaySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(overlaySearchInput.value);
        });
    }
    
    // Close overlay on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });

    const vibrateTargets = document.querySelectorAll('.product-item, .wearable-card');
    vibrateTargets.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const cta = document.querySelector('.cta-btn, .cta-btn-modern');
            if (cta) {
                cta.classList.add('vibrate');
                setTimeout(() => cta.classList.remove('vibrate'), 1500);
            }
        });
    });
});

// Search Functionality
function openSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) {
        overlay.classList.add('active');
        const input = document.querySelector('#searchOverlay input');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function handleSearch(query) {
    if (!query) return;
    
    // Check if we are on products.html
    if (window.location.pathname.includes('products.html')) {
        // If specific function exists, call it
        if (typeof filterProducts === 'function') {
            filterProducts(query);
            closeSearch();
        } else {
             window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
    } else {
        // Redirect to products page with search query
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

// Cart helpers and UI (localStorage fallback for demo)
function getCart() { return JSON.parse(localStorage.getItem('cart')||'[]'); }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); }
async function updateCartBadge(){
    const cartLink = document.querySelector('a[href="cart.html"]');

    // Prefer Firestore cart when user is signed in
    try {
        if (window.auth && auth.currentUser && window.db) {
            const uid = auth.currentUser.uid;
            const snap = await db.collection('carts').doc(uid).collection('items').get();
            const count = snap.docs.reduce((s,d)=> s + (d.data().quantity||0), 0);
            if (cartLink) {
                let badge = cartLink.querySelector('.cart-badge');
                if (!badge) { badge = document.createElement('span'); badge.className = 'cart-badge'; badge.setAttribute('aria-hidden','true'); badge.style.cssText = 'background:var(--accent-gold); color:#fff; border-radius:999px; padding:2px 8px; margin-left:8px; font-size:0.8rem;'; cartLink.appendChild(badge); }
                badge.textContent = count; badge.style.display = count ? 'inline-block' : 'none';
            }
            return;
        }
    } catch(e){ console.error(e); }

    // fallback to legacy token-based backend API
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const res = await fetch('http://localhost:5000/api/cart', { headers: { Authorization: token } });
            if (res.ok) {
                const data = await res.json();
                const count = data.reduce((s,i)=> s + (i.quantity||0), 0);
                if (cartLink) {
                    let badge = cartLink.querySelector('.cart-badge');
                    if (!badge) { badge = document.createElement('span'); badge.className = 'cart-badge'; badge.setAttribute('aria-hidden','true'); badge.style.cssText = 'background:var(--accent-gold); color:#fff; border-radius:999px; padding:2px 8px; margin-left:8px; font-size:0.8rem;'; cartLink.appendChild(badge); }
                    badge.textContent = count; badge.style.display = count ? 'inline-block' : 'none';
                }
                return;
            }
        } catch(e){ console.error(e); }
    }

    // fallback to localStorage cart badge
    const cart = getCart();
    const count = cart.reduce((s,i)=>s + (i.quantity||0), 0);
    if (cartLink) {
        let badge = cartLink.querySelector('.cart-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.setAttribute('aria-hidden','true');
            badge.style.cssText = 'background:var(--accent-gold); color:#fff; border-radius:999px; padding:2px 8px; margin-left:8px; font-size:0.8rem;';
            cartLink.appendChild(badge);
        }
        badge.textContent = count;
        badge.style.display = count ? 'inline-block' : 'none';
    }
}

async function addToCart(idOrProduct) {
    let cart = getCart();
    let product = null;
    if (typeof idOrProduct === 'object') product = idOrProduct;
    else {
        if (window.allProducts) product = window.allProducts.find(p => p.id === idOrProduct);
        if (!product) {
            const el = document.querySelector(`[data-product-id='${idOrProduct}']`);
            if (el) {
                product = {
                    id: Number(el.dataset.productId),
                    name: el.dataset.productName,
                    price: Number(el.dataset.productPrice) || 0,
                    image: el.dataset.productImage
                };
            }
        }
    }
    if (!product) { alert('Product not found'); return; }

    const token = localStorage.getItem('token');
    if (token) {
        try {
            const res = await fetch('http://localhost:5000/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ product_id: product.id, quantity: 1 })
            });
            if (res.ok) {
                showToast(`${product.name} added to cart`);
                updateCartBadge();
                return;
            }
        } catch (e) { console.error(e); }
    }

    const found = cart.find(i => i.id === product.id);
    if (found) found.quantity = (found.quantity || 0) + 1;
    else cart.push({ ...product, quantity: 1 });
    saveCart(cart);
    showToast(`${product.name} added to cart`);
}

function showToast(msg){
    let t = document.getElementById('ph-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'ph-toast';
        Object.assign(t.style, { position: 'fixed', right: '20px', bottom: '20px', background: '#333', color: '#fff', padding: '12px 18px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', zIndex: 9999, opacity: 0, transition: 'all 250ms ease' });
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = 1;
    t.style.transform = 'translateY(0)';
    setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translateY(6px)'; }, 2000);
}

document.addEventListener('DOMContentLoaded', updateCartBadge);


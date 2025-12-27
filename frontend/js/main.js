// Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    console.log('Phadizon Loaded');

    const loader = document.getElementById('loaderOverlay');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 1200);

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

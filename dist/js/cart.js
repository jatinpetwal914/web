/*
  Cart Client (Firestore-based)
  - Uses Firestore collection: /carts/{uid}/items/{productId}
  - Listens with onSnapshot for realtime updates
  - Exposes: addToCart(productOrId), removeItem(productId), updateQuantity(productId, delta), placeOrder()
  - Requires: firebase-auth.js (defines `auth` and `db`) and firebase functions loaded
*/

// Stripe publishable key: can be set in `window.APP_CONFIG.STRIPE_PUBLISHABLE_KEY` or here
const STRIPE_PUBLISHABLE_KEY = (window.APP_CONFIG && window.APP_CONFIG.STRIPE_PUBLISHABLE_KEY) ? window.APP_CONFIG.STRIPE_PUBLISHABLE_KEY : '<YOUR_STRIPE_PUBLISHABLE_KEY>';
let stripe = null;
let elements = null;
let cardElement = null;

// DOM refs
const cartItemsEl = document.getElementById('cartItems');
const cartSummaryEl = document.getElementById('cartSummary');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutModal = document.getElementById('checkoutModal');
const confirmCheckoutBtn = document.getElementById('confirmCheckout');
const cancelCheckoutBtn = document.getElementById('cancelCheckout');
const cardErrors = document.getElementById('card-errors');

let unsubscribeItems = null;
let unsubscribeCartDoc = null;
let currentUser = null;

function initStripeIfNeeded(){
  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('<YOUR_STRIPE')) return console.warn('Stripe publishable key not set in cart.js');
  if (!stripe) {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    elements = stripe.elements();
  }
}

function mountCardElement(){
  if (!elements) return;
  if (!cardElement) {
    cardElement = elements.create('card', {hidePostalCode: true});
    cardElement.mount('#card-element');
    cardElement.on('change', (e)=>{ cardErrors.textContent = e.error ? e.error.message : '' });
  }
}

function unmountCardElement(){
  if (cardElement) { cardElement.unmount(); cardElement = null; }
}

function showCheckoutModal(){
  initStripeIfNeeded();
  if (!stripe) return alert('Payment is not configured on this demo.');
  checkoutModal.style.display = 'flex';
  mountCardElement();
}
function hideCheckoutModal(){
  checkoutModal.style.display = 'none';
  unmountCardElement();
}

// Render helpers
function renderCartItems(items){
  if (!cartItemsEl) return;
  if (!items || items.length === 0) {
    cartItemsEl.innerHTML = '<p style="text-align:center;color:#888">Your cart is empty.</p>';
    cartSummaryEl.style.display = 'none';
    return;
  }
  cartItemsEl.innerHTML = '';
  items.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const name = data.name || 'Unnamed product';
    const qty = data.quantity || 1;
    const price = data.price || 0; // price shown for reference; server authoritative

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:1rem;">
        <img src="${data.image || 'https://placehold.co/80x80?text=Img'}" alt="${name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">
        <div>
          <h3>${name}</h3>
          <p>Price: ₹${price}</p>
          <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <button class="remove-btn" style="padding:6px 10px;" data-action="decrease" data-id="${id}">−</button>
            <div style="min-width:34px; text-align:center; font-weight:600">${qty}</div>
            <button class="checkout-btn" style="padding:6px 10px;" data-action="increase" data-id="${id}">+</button>
            <button class="remove-btn" style="background:#ff4757; margin-left:12px;" data-action="remove" data-id="${id}">Remove</button>
          </div>
        </div>
      </div>
      <div style="text-align:right;">
        <p style="font-size:1.1rem; font-weight:700;">₹${price * qty}</p>
      </div>
    `;
    cartItemsEl.appendChild(div);
  });
}

// Listen to auth changes and cart snapshots
function startCartForUser(uid){
  stopCartListener();
  currentUser = uid;
  const itemsRef = db.collection('carts').doc(uid).collection('items');
  const cartDocRef = db.collection('carts').doc(uid);

  unsubscribeItems = itemsRef.onSnapshot(snapshot => {
    renderCartItems(snapshot.docs);
    // update UI badge
    if (typeof updateCartBadge === 'function') updateCartBadge();
  }, err => {
    console.error('Cart items snapshot error', err);
  });

  unsubscribeCartDoc = cartDocRef.onSnapshot(doc => {
    if (!doc.exists) {
      cartSummaryEl.style.display = 'none';
      return;
    }
    const data = doc.data();
    const total = data.totalAmount || 0;
    cartTotalEl.innerText = '₹' + total;
    cartSummaryEl.style.display = 'block';
  }, err => console.error('Cart doc snapshot error', err));
}

function stopCartListener(){
  if (unsubscribeItems) { unsubscribeItems(); unsubscribeItems = null; }
  if (unsubscribeCartDoc) { unsubscribeCartDoc(); unsubscribeCartDoc = null; }
}

function renderLocalCart(){
  stopCartListener();
  currentUser = null;
  const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (localCart.length === 0) {
    renderCartItems([]);
    return;
  }
  // create a fake snapshot-like array
  const fakeDocs = localCart.map(i => ({ id: String(i.id), data: () => i }));
  // total
  const total = localCart.reduce((s,i)=>s + (i.price||0)*(i.quantity||1), 0);
  cartTotalEl.innerText = '₹' + total;
  cartSummaryEl.style.display = 'block';
  renderCartItems(fakeDocs);
}

// Cart operations
async function addToCart(idOrProduct){
  try {
    let product = null;
    if (typeof idOrProduct === 'object') product = idOrProduct;
    else product = { id: idOrProduct };

    if (!product || !product.id) return showToast('Invalid product');

    if (!auth.currentUser) {
      // local fallback
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const pid = String(product.id);
      let found = cart.find(i => String(i.id) === pid);
      if (found) found.quantity = (found.quantity||0) + 1;
      else cart.push({ id: pid, name: product.name||'Product', price: product.price||0, image: product.image, quantity: 1 });
      localStorage.setItem('cart', JSON.stringify(cart));
      renderLocalCart();
      updateCartBadge();
      showToast('Added to cart');
      return;
    }

    const uid = auth.currentUser.uid;
    const itemRef = db.collection('carts').doc(uid).collection('items').doc(String(product.id));

    await db.runTransaction(async t => {
      const itemDoc = await t.get(itemRef);
      // fetch product official data (if exists)
      const prodRef = db.collection('products').doc(String(product.id));
      const prodDoc = await t.get(prodRef).catch(()=>null);
      const officialPrice = prodDoc && prodDoc.exists ? prodDoc.data().price : (product.price || 0);

      if (itemDoc.exists) {
        t.update(itemRef, { quantity: (itemDoc.data().quantity||0) + 1, price: officialPrice, name: product.name || itemDoc.data().name || prodDoc?.data()?.name });
      } else {
        t.set(itemRef, { productId: String(product.id), name: product.name || (prodDoc?.data()?.name || 'Product'), price: officialPrice, quantity: 1, addedAt: firebase.firestore.FieldValue.serverTimestamp(), image: product.image || (prodDoc?.data()?.image || '') });
      }
    });
    showToast('Added to cart');
  } catch (e) { console.error(e); showToast('Could not add to cart'); }
}

async function removeItem(productId){
  if (!auth.currentUser) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(i => String(i.id) !== String(productId));
    localStorage.setItem('cart', JSON.stringify(cart));
    renderLocalCart();
    updateCartBadge();
    return;
  }
  try {
    const uid = auth.currentUser.uid;
    await db.collection('carts').doc(uid).collection('items').doc(String(productId)).delete();
    showToast('Removed');
  } catch (e) { console.error(e); showToast('Could not remove item'); }
}

async function updateQuantity(productId, delta){
  if (!auth.currentUser) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.map(i => { if (String(i.id) === String(productId)) i.quantity = Math.max(0, (i.quantity||1) + delta); return i; }).filter(i => i.quantity>0);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderLocalCart();
    updateCartBadge();
    return;
  }
  try {
    const uid = auth.currentUser.uid;
    const itemRef = db.collection('carts').doc(uid).collection('items').doc(String(productId));
    await db.runTransaction(async t => {
      const doc = await t.get(itemRef);
      if (!doc.exists) return;
      const newQty = Math.max(0, (doc.data().quantity||1) + delta);
      if (newQty <= 0) t.delete(itemRef);
      else t.update(itemRef, { quantity: newQty });
    });
  } catch (e) { console.error(e); showToast('Could not update quantity'); }
}

// Place order: create payment method via Stripe, then call backend callable function
async function placeOrder(){
  if (!auth.currentUser) { alert('Please login to place an order'); window.location.href = 'login.html'; return; }
  showCheckoutModal();
}

// Called when confirm checkout button pressed
async function confirmCheckout(){
  if (!stripe || !cardElement) return showToast('Payment is not configured');
  setButtonLoading(confirmCheckoutBtn, true);
  try {
    const {error, paymentMethod} = await stripe.createPaymentMethod({ type: 'card', card: cardElement });
    if (error) { cardErrors.textContent = error.message; setButtonLoading(confirmCheckoutBtn, false); return; }

    // Call Firebase callable function
    const processPayment = firebase.functions().httpsCallable('processPayment');
    const resp = await processPayment({ paymentMethodId: paymentMethod.id });
    const result = resp.data;

    if (result && result.success) {
      hideCheckoutModal();
      showToast('Payment successful! Order placed.');
      setTimeout(()=> window.location.href = 'orders.html', 1000);
      return;
    }

    // Handle SCA (3DS) if required
    if (result && result.requiresAction && result.clientSecret) {
      const confirmResult = await stripe.confirmCardPayment(result.clientSecret);
      if (confirmResult.error) {
        cardErrors.textContent = confirmResult.error.message || 'Authentication failed';
        setButtonLoading(confirmCheckoutBtn, false);
        return;
      }
      // Payment succeeded client-side; finalize on server
      const finalizeResp = await processPayment({ finalize: true, paymentIntentId: confirmResult.paymentIntent.id });
      const finalizeResult = finalizeResp.data;
      if (finalizeResult && finalizeResult.success) {
        hideCheckoutModal();
        showToast('Payment successful! Order placed.');
        setTimeout(()=> window.location.href = 'orders.html', 1000);
        return;
      } else {
        cardErrors.textContent = finalizeResult && finalizeResult.error ? finalizeResult.error : 'Payment finalization failed';
        setButtonLoading(confirmCheckoutBtn, false);
        return;
      }
    }

    const msg = (result && result.error) ? result.error : 'Payment failed';
    cardErrors.textContent = msg;
    setButtonLoading(confirmCheckoutBtn, false);

  } catch (e) { console.error(e); cardErrors.textContent = e.message || 'Payment failed'; }
}

function setButtonLoading(btn, loading){ if(!btn) return; btn.disabled = loading; btn.style.opacity = loading ? 0.7 : 1; btn.textContent = loading ? 'Processing...' : 'Pay'; }

// Wire up UI events
if (confirmCheckoutBtn) confirmCheckoutBtn.addEventListener('click', confirmCheckout);
if (cancelCheckoutBtn) cancelCheckoutBtn.addEventListener('click', ()=>{ hideCheckoutModal(); });

// Button delegation for cart item controls
cartItemsEl?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  if (!action || !id) return;
  if (action === 'decrease') updateQuantity(id, -1);
  else if (action === 'increase') updateQuantity(id, +1);
  else if (action === 'remove') removeItem(id);
});

// Expose globally for product pages to call
window.addToCart = addToCart;
window.removeItem = removeItem;
window.updateQuantity = updateQuantity;
window.placeOrder = placeOrder;

// Auth listener setup
auth.onAuthStateChanged(user => {
  if (user) {
    startCartForUser(user.uid);
  } else {
    renderLocalCart();
  }
});

// Exported for testing
// end of cart.js

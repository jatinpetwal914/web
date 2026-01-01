import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();
const db = admin.firestore();

const stripeSecret = process.env.STRIPE_SECRET;
if (!stripeSecret) {
  console.warn('STRIPE_SECRET is not set in functions environment. Payment functions will fail until it is configured.');
}
const stripe = new Stripe(stripeSecret || '', { apiVersion: '2022-11-15' });

// Trigger: Recalculate cart totals and enforce official product prices
export const onCartItemWrite = functions.firestore
  .document('carts/{userId}/items/{itemId}')
  .onWrite(async (change, context) => {
    const { userId } = context.params;
    const itemsRef = db.collection('carts').doc(userId).collection('items');

    try {
      const itemsSnap = await itemsRef.get();
      let total = 0;
      const batch = db.batch();

      for (const doc of itemsSnap.docs) {
        const data = doc.data();
        const productId = data.productId || doc.id;
        // Fetch official product price if exists
        const prodDoc = await db.collection('products').doc(String(productId)).get().catch(() => null);
        const officialPrice = prodDoc && prodDoc.exists ? prodDoc.data()?.price : data.price || 0;

        // If mismatch, update the item price to official
        if (!data.price || data.price !== officialPrice) {
          const itemRef = itemsRef.doc(doc.id);
          batch.update(itemRef, { price: officialPrice });
        }

        const qty = data.quantity || 0;
        total += officialPrice * qty;
      }

      // Update cart summary on parent doc
      const cartDocRef = db.collection('carts').doc(userId);
      batch.set(cartDocRef, { totalAmount: total, currency: 'INR', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

      await batch.commit();
      return { success: true };
    } catch (err) {
      console.error('onCartItemWrite error', err);
      return { success: false, error: String(err) };
    }
  });

// Callable: processPayment
export const processPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const uid = context.auth.uid;
  const paymentMethodId = data.paymentMethodId;
  if (!paymentMethodId) throw new functions.https.HttpsError('invalid-argument', 'paymentMethodId is required');

  try {
    // If this call is to finalize a previously confirmed PaymentIntent (after client SCA), handle that flow
    if (data.finalize === true && data.paymentIntentId) {
      if (!stripe) throw new functions.https.HttpsError('internal', 'Stripe not configured');
      const pi = await stripe.paymentIntents.retrieve(data.paymentIntentId);
      if (pi.status !== 'succeeded') throw new functions.https.HttpsError('failed-precondition', 'Payment not completed');

      // proceed to create order and clear cart (same as below)
      const itemsRef = db.collection('carts').doc(uid).collection('items');
      const itemsSnap = await itemsRef.get();
      const lineItems: Array<any> = [];
      let total = 0;
      for (const doc of itemsSnap.docs) {
        const dataDoc = doc.data();
        const productId = dataDoc.productId || doc.id;
        const prodDoc = await db.collection('products').doc(String(productId)).get().catch(() => null);
        const officialPrice = prodDoc && prodDoc.exists ? prodDoc.data()?.price : dataDoc.price || 0;
        const qty = dataDoc.quantity || 0;
        total += officialPrice * qty;
        lineItems.push({ productId: String(productId), name: dataDoc.name || prodDoc?.data()?.name || '', price: officialPrice, quantity: qty });
      }

      const orderRef = db.collection('orders').doc();
      const order = {
        userId: uid,
        items: lineItems,
        totalAmount: total,
        currency: 'INR',
        paymentIntentId: data.paymentIntentId,
        status: 'succeeded',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await orderRef.set(order);

      const batch = db.batch();
      for (const doc of itemsSnap.docs) batch.delete(itemsRef.doc(doc.id));
      const cartDocRef = db.collection('carts').doc(uid);
      batch.set(cartDocRef, { totalAmount: 0, currency: 'INR', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await batch.commit();

      return { success: true, orderId: orderRef.id, total };
    }

    // Recalculate cart on server (trust server prices only)
    const itemsRef = db.collection('carts').doc(uid).collection('items');
    const itemsSnap = await itemsRef.get();
    if (itemsSnap.empty) throw new functions.https.HttpsError('failed-precondition', 'Cart is empty');

    const lineItems: Array<any> = [];
    let total = 0;

    for (const doc of itemsSnap.docs) {
      const data = doc.data();
      const productId = data.productId || doc.id;
      const prodDoc = await db.collection('products').doc(String(productId)).get().catch(() => null);
      const officialPrice = prodDoc && prodDoc.exists ? prodDoc.data()?.price : data.price || 0;
      const qty = data.quantity || 0;
      total += officialPrice * qty;
      lineItems.push({ productId: String(productId), name: data.name || prodDoc?.data()?.name || '', price: officialPrice, quantity: qty });
    }

    if (total <= 0) throw new functions.https.HttpsError('failed-precondition', 'Cart total invalid');

    const amountInPaise = Math.round(total * 100); // Convert to paisa

    if (!stripe) throw new functions.https.HttpsError('internal', 'Stripe not configured');

    // Create and confirm payment intent with provided payment method
    const idempotencyKey = `pay_${uid}_${Date.now()}`;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: { uid },
      description: `Phadizon order by ${uid}`
    }, { idempotencyKey });

    const status = paymentIntent.status;

    // Handle Next Actions (SCA) - return client_secret to client so it can complete authentication if required
    if (status === 'requires_action' || status === 'requires_source_action') {
      return { success: false, requiresAction: true, clientSecret: paymentIntent.client_secret };
    }

    // Create order document
    const orderRef = db.collection('orders').doc();
    const order = {
      userId: uid,
      items: lineItems,
      totalAmount: total,
      currency: 'INR',
      paymentIntentId: paymentIntent.id,
      status: status === 'succeeded' ? 'succeeded' : (status === 'requires_capture' ? 'pending' : 'failed'),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await orderRef.set(order);

    // Clear the cart items
    const batch = db.batch();
    for (const doc of itemsSnap.docs) {
      batch.delete(itemsRef.doc(doc.id));
    }
    // Also reset cart totals
    const cartDocRef = db.collection('carts').doc(uid);
    batch.set(cartDocRef, { totalAmount: 0, currency: 'INR', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    await batch.commit();

    return { success: true, orderId: orderRef.id, total };

});
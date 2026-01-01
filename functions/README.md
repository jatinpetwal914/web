Firebase Functions (TypeScript)

Setup
1. Copy `.env.example` to `.env` (locally) and set STRIPE_SECRET to your Stripe secret key.
2. Install dependencies inside `functions/`:
   npm install
3. Build and deploy using Firebase CLI (ensure you're logged into the correct Firebase project):
   npm run build
   firebase deploy --only functions

Functions
- `onCartItemWrite` (Firestore trigger): recalculates and enforces product prices, and writes cart total to `/carts/{userId}`.
- `processPayment` (Callable): validates cart server-side, creates and confirms a Stripe PaymentIntent, writes an `/orders/{orderId}` document, and clears the user's cart.

Security
- Ensure `STRIPE_SECRET` is set in your environment or using Firebase Functions configuration (recommended):
  firebase functions:config:set stripe.secret="sk_live_..."

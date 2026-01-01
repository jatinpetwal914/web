# Phadizon (local dev)

This repository contains a small Express backend and a frontend shipped in `/frontend`.

## Quick start (run MySQL in Docker and start server)

1. Copy env example:

   cp .env.example .env

2. Start the database (this will initialize schema from `database/phadizon.sql`):

   docker-compose up -d

3. Install Node dependencies (only needed once):

   npm install

4. Start the server:

   npm run start

5. Health check:

   curl -s http://localhost:5000/api/health

If health returns `{ "db": true }` the DB is reachable and the registration endpoint should work.

---

## Payment & Cloud Functions (Stripe + Firestore)

This project now includes Firebase Cloud Functions (TypeScript) that handle secure cart totals and Stripe payments.

Quick steps:
- In `functions/.env.example` set `STRIPE_SECRET` to your Stripe secret key (or configure via `firebase functions:config:set`).
- `cd functions && npm install` then `npm run build` and `firebase deploy --only functions`.
- In the frontend, copy `frontend/js/config.example.js` to `frontend/js/config.js` and set `APP_CONFIG.STRIPE_PUBLISHABLE_KEY` to your Stripe publishable key.
- Seed official products into Firestore (optional) with `node backend/seed-products.js` after creating a service account and `serviceAccountKey.json`.

Security notes:
- Prices are recalculated server-side in Cloud Functions; clients must not be trusted for amounts.
- Firestore security rules were updated to ensure users can only read/write their own carts and orders.



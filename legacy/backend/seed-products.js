// Run this script locally (node seed-products.js) to seed products into Firestore for official prices
// Requires GOOGLE_APPLICATION_CREDENTIALS to be set to a service account JSON with Firestore access

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Create and drop your service account here

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const products = [
  { id: '13', name: 'Sesama', price: 120, image: '../Sesama.png' },
  { id: '14', name: 'Pahadi Rajma', price: 180, image: '../Pahadi%20Rajma.png' },
  { id: '4', name: 'Kemomile', price: 300, image: 'assets/images/kemomile.jpg' },
  { id: '5', name: 'Alsi', price: 200, image: 'assets/images/alsi.jpg' },
  { id: '6', name: 'Rosemarie', price: 400, image: 'assets/images/rosemary.jpg' }
];

async function seed(){
  for (const p of products) {
    await db.collection('products').doc(String(p.id)).set({ name: p.name, price: p.price, image: p.image });
    console.log('Seeded', p.name);
  }
  console.log('Done');
}

seed().catch(console.error);
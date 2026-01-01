const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./db');

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
// adminRoutes exposes /products and admin actions; mount it at /api to make /api/products available
app.use('/api', adminRoutes);

// health endpoint
app.get('/api/health', (req,res)=>{
  db.query('SELECT 1', [], (err)=>{
    if (err) return res.status(500).json({ db: false, message: err.message });
    res.json({ db: true });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



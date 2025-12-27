const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);


const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(5000, () => console.log("Server running"));

const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);



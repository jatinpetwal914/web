const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db');
const jwt = require('jsonwebtoken');

const razorpay = new Razorpay({
  key_id: "YOUR_KEY_ID",
  key_secret: "YOUR_KEY_SECRET"
});

/* AUTH */
function auth(req,res,next){
  const token = req.headers.authorization;
  req.user = jwt.verify(token,"USER_SECRET");
  next();
}

/* CREATE ORDER */
router.post('/create-order', auth, (req,res)=>{
  const { amount } = req.body;

  razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  }, (err, order)=>{
    res.json(order);
  });
});

/* VERIFY PAYMENT */
router.post('/verify', auth, (req,res)=>{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, total } = req.body;

  const sign = crypto.createHmac('sha256', "YOUR_KEY_SECRET")
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if(sign === razorpay_signature){
    db.query(
      "INSERT INTO orders (user_id,total,payment_id,payment_status) VALUES (?,?,?,?)",
      [req.user.id,total,razorpay_payment_id,"SUCCESS"]
    );
    db.query("DELETE FROM cart WHERE user_id=?", [req.user.id]);
    res.send("Payment verified");
  } else {
    res.status(400).send("Payment failed");
  }
});

module.exports = router;

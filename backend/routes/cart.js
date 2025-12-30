const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

/* AUTH MIDDLEWARE */
function auth(req,res,next){
  const token = req.headers.authorization;
  if(!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token,"USER_SECRET");
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/* ADD TO CART (supports quantity and upsert) */
router.post('/add', auth, (req,res)=>{
  const { product_id, quantity = 1 } = req.body;
  const qty = Math.max(1, parseInt(quantity,10) || 1);

  db.query("SELECT id,quantity FROM cart WHERE user_id=? AND product_id=?", [req.user.id, product_id], (err, rows)=>{
    if (err) return res.status(500).json({ message: 'DB error' });
    if (rows && rows.length){
      const existing = rows[0];
      const newQ = existing.quantity + qty;
      db.query("UPDATE cart SET quantity=? WHERE id=?", [newQ, existing.id], (err)=>{
        if (err) return res.status(500).json({ message: 'DB error' });
        res.json({ message: 'Updated cart', product_id, quantity: newQ });
      });
    } else {
      db.query("INSERT INTO cart (user_id,product_id,quantity) VALUES (?,?,?)", [req.user.id, product_id, qty], (err,result)=>{
        if (err) return res.status(500).json({ message: 'DB error' });
        res.json({ message: 'Added to cart', product_id, quantity: qty });
      });
    }
  });
});

/* GET CART */
router.get('/', auth, (req,res)=>{
  db.query(
    `SELECT cart.id, cart.product_id, cart.quantity, products.name, products.price, products.image 
     FROM cart JOIN products ON cart.product_id=products.id
     WHERE cart.user_id=?`,
    [req.user.id],
    (err,result)=>{
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(result);
    }
  );
});

/* REMOVE ITEM */
router.delete('/:id', auth, (req,res)=>{
  db.query(
    "DELETE FROM cart WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    ()=>res.send("Removed")
  );
});

module.exports = router;

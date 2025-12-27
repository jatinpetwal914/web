const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

function auth(req,res,next){
  const token = req.headers.authorization;
  req.user = jwt.verify(token,"USER_SECRET");
  next();
}

/* PLACE ORDER */
router.post('/place', auth, (req,res)=>{
  db.query(
    "SELECT cart.*, products.price FROM cart JOIN products ON cart.product_id=products.id WHERE user_id=?",
    [req.user.id],
    (err,items)=>{
      let total = items.reduce((s,i)=>s+i.price,0);

      db.query(
        "INSERT INTO orders (user_id,total) VALUES (?,?)",
        [req.user.id,total],
        (err,order)=>{
          items.forEach(i=>{
            db.query(
              "INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)",
              [order.insertId,i.product_id,1,i.price]
            );
          });

          db.query("DELETE FROM cart WHERE user_id=?",[req.user.id]);
          res.send("Order placed");
        }
      );
    }
  );
});

/* USER ORDERS */
router.get('/', auth, (req,res)=>{
  db.query(
    "SELECT * FROM orders WHERE user_id=?",
    [req.user.id],
    (err,result)=>res.json(result)
  );
});

module.exports = router;

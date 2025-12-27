const router = require('express').Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

/* AUTH MIDDLEWARE */
function auth(req,res,next){
  const token = req.headers.authorization;
  if(!token) return res.sendStatus(401);
  req.user = jwt.verify(token,"USER_SECRET");
  next();
}

/* ADD TO CART */
router.post('/add', auth, (req,res)=>{
  const { product_id } = req.body;

  db.query(
    "INSERT INTO cart (user_id,product_id) VALUES (?,?)",
    [req.user.id, product_id],
    ()=>res.send("Added to cart")
  );
});

/* GET CART */
router.get('/', auth, (req,res)=>{
  db.query(
    `SELECT cart.id, products.name, products.price 
     FROM cart JOIN products ON cart.product_id=products.id
     WHERE cart.user_id=?`,
    [req.user.id],
    (err,result)=>res.json(result)
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

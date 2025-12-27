const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');

/* ADMIN LOGIN */
router.post('/login', (req, res) => {
  db.query(
    "SELECT * FROM admins WHERE email=?",
    [req.body.email],
    async (err, result) => {
      if (result.length === 0) return res.status(401).send("Invalid");

      const valid = await bcrypt.compare(
        req.body.password,
        result[0].password
      );

      if (!valid) return res.status(401).send("Wrong Password");

      const token = jwt.sign({ id: result[0].id }, "ADMIN_SECRET");
      res.json({ token });
    }
  );
});

/* ADD PRODUCT */
router.post('/add-product', (req, res) => {
  const { name, price, image } = req.body;
  db.query(
    "INSERT INTO products (name,price,image) VALUES (?,?,?)",
    [name, price, image],
    () => res.send("Product Added")
  );
});

/* GET PRODUCTS */
router.get('/products', (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    res.json(result);
  });
});

/* DELETE PRODUCT */
router.delete('/product/:id', (req, res) => {
  db.query(
    "DELETE FROM products WHERE id=?",
    [req.params.id],
    () => res.send("Deleted")
  );
});

module.exports = router;

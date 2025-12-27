const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.post('/register', async (req,res)=>{
  const hash = await bcrypt.hash(req.body.password,10);
  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [req.body.name,req.body.email,hash],
    ()=>res.send("Registered")
  );
});

module.exports = router;

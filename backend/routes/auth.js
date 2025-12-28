const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');

router.post('/register', async (req,res)=>{
  const hash = await bcrypt.hash(req.body.password,10);
  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [req.body.name,req.body.email,hash],
    (err,result)=>{
      if (err) return res.status(500).send('DB error');
      // return token immediately for convenience
      const token = jwt.sign({ id: result.insertId, name: req.body.name, email: req.body.email }, 'USER_SECRET', { expiresIn: '7d' });
      res.json({ message: 'Registered', token, user: { id: result.insertId, name: req.body.name, email: req.body.email } });
    }
  );
});

nrouter.post('/login', (req,res)=>{
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email=?", [email], async (err, rows)=>{
    if (err) return res.status(500).send('DB error');
    if (!rows || rows.length === 0) return res.status(400).send('Invalid credentials');
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).send('Invalid credentials');
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, 'USER_SECRET', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

nmodule.exports = router;

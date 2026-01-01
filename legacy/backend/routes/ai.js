const router = require('express').Router();

/* SIMPLE AI LOGIC (RULE-BASED) */
router.post('/chat',(req,res)=>{
  const msg = req.body.message.toLowerCase();

  let reply = "I'm here to help 🌄";

  if(msg.includes("order")) reply = "You can check orders in My Orders section.";
  else if(msg.includes("payment")) reply = "We support secure online payments.";
  else if(msg.includes("delivery")) reply = "Delivery takes 3–5 working days.";
  else if(msg.includes("uttarakhand")) reply = "We promote pure Uttarakhand culture 🏔️";

  res.json({ reply });
});

module.exports = router;

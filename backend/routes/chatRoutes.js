const express = require('express');
const router = express.Router();
const { askGemini } = require('../services/cardService');

router.post('/ask', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing message' });

  const result = await askGemini(text);
  res.json(result);
});

module.exports = router;
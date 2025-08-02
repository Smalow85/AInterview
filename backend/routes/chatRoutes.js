const express = require('express');
const router = express.Router();
const { askGemini } = require('../services/cardService');

router.post('/ask', async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing message' });

  const result = await askGemini(text, language);
  res.json(result);
});

module.exports = router;
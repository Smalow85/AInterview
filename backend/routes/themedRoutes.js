const express = require('express');
const router = express.Router();
const { generateLearningObjectivesPlan } = require('../services/themedConversationService');

router.post('/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  const request = req.body;

  try {
    const goalsPlan = await generateLearningObjectivesPlan(request, sessionId);
    if (!goalsPlan || !goalsPlan.learningGoals) {
      return res.status(400).json({ error: 'Invalid learning goals returned' });
    }

    return res.json(goalsPlan);
  } catch (err) {
    console.error('Error generating themed plan:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
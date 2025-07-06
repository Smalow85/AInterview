const express = require('express');
const router = express.Router();
const { generateInterviewPlan } = require('../services/interviewService');

router.post('/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  const requestBody = req.body;

  try {
    const interviewPlan = await generateInterviewPlan(requestBody);

    if (!interviewPlan || !interviewPlan.phases) {
      return res.status(400).send();
    }

    return res.json(interviewPlan);
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
});

module.exports = router;
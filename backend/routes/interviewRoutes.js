const express = require('express');
const router = express.Router();
const { generateInterviewPlan } = require('../services/interviewService');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { db } = require('../config/firebaseConfig');

const INTERVIEW_COST = 100;

// Middleware
router.use(verifyFirebaseToken);

router.post('/:sessionId', async (req, res) => {
  const { uid } = req.user;
  const { sessionId } = req.params;
  const requestBody = req.body;

  const userDocRef = db.collection('users').doc(uid);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists) {
        throw new Error('User document not found!');
      }

      const currentTokens = userDoc.data().tokens;

      if (currentTokens < INTERVIEW_COST) {
        const error = new Error('Not enough tokens');
        error.code = 'INSUFFICIENT_FUNDS';
        throw error;
      }

      const newBalance = currentTokens - INTERVIEW_COST;
      transaction.update(userDocRef, { tokens: newBalance });
    });

    const interviewPlan = await generateInterviewPlan(requestBody);

    if (!interviewPlan || !interviewPlan.phases) {
      return res.status(400).send();
    }

    return res.json(interviewPlan);

  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Not enough tokens to start an interview.'
      });
    }
    console.error('Error during interview plan generation or token deduction:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
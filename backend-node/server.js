require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { askGemini } = require('./cardService');
const { generateLearningObjectivesPlan } = require('./themedConversationService');
const { generateInterviewPlan } = require('./interviewService');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // если нужны куки или авторизация
}));

app.use(bodyParser.json());

app.post('/api/chat/ask', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing message' });

  const result = await askGemini(text);
  res.json(result);
});

app.post('/api/themed-conversation-plan/:sessionId', async (req, res) => {
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

// Предположим, у тебя есть модели Phase и Question с отношением один-ко-многим

app.post('/api/interview-plan/:sessionId', async (req, res) => {
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


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

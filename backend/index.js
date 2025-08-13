require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Импортируем маршруты
const chatRoutes = require('./routes/chatRoutes');
const themedRoutes = require('./routes/themedRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const userRoutes = require('./routes/userRoutes');

// Инициализируем Firebase Admin SDK при старте сервера
require('./config/firebaseConfig');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(bodyParser.json());

app.get('/api/ping', (req, res) => {
  res.json({ status: 'pong' });
});
app.use('/api/chat', chatRoutes);
app.use('/api/themed-conversation-plan', themedRoutes);
app.use('/api/interview-plan', interviewRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebaseConfig');

const FREE_TOKENS_ON_REGISTRATION = 500; // Количество бесплатных токенов

// POST /api/users/register
// Создает пользователя в Firebase Authentication и запись в Firestore
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Создаем пользователя в Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });

    // 2. Создаем для него документ в коллекции 'users' в Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      email: userRecord.email,
      createdAt: new Date().toISOString(),
      tokens: FREE_TOKENS_ON_REGISTRATION,
    });

    res.status(201).json({
      message: 'User registered successfully.',
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user', details: error.message });
  }
});

module.exports = router;

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ВАША КОНФИГУРАЦИЯ FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB8eA0D4X8PryA3LFYhjpCaP0JzKCRS8Qw",
  authDomain: "aiinterview-295a5.firebaseapp.com",
  projectId: "aiinterview-295a5",
  storageBucket: "aiinterview-295a5.firebasestorage.app",
  messagingSenderId: "457666838191",
  appId: "1:457666838191:web:0e42b01061e4b970ca9e5a"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем сервисы для использования в других частях приложения
export const auth = getAuth(app);
export const db = getFirestore(app);
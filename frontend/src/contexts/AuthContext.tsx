import React, { useContext, useState, useEffect, createContext } from 'react';
import {
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore'; 
import axios from 'axios';
import { auth, db } from '../firebaseConfig';

// Определим тип для профиля пользователя
interface UserProfile extends DocumentData {
  email: string;
  tokens: number;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function register(email: string, password: string) {
    await axios.post('/api/users/register', {
      email,
      password,
    });
    return signInWithEmailAndPassword(auth, email, password);
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    // Слушатель для состояния аутентификации Firebase
    const unsubscribeAuth = onAuthStateChanged(auth as Auth, user => {
      setCurrentUser(user);
      if (!user) {
        // Если пользователя нет, очищаем профиль и выключаем загрузку
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Слушатель для данных в Firestore
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid);
      const unsubscribeFirestore = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          // Это может произойти, если пользователь есть в Auth, но нет в Firestore
          console.error('User document does not exist in Firestore!');
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribeFirestore();
    } 
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
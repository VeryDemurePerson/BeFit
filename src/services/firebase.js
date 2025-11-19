// src/services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAEbRqbnqonvBSKVsjblaHMCbZfUAB9gL0",
  authDomain: "befit-3a7ca.firebaseapp.com",
  projectId: "befit-3a7ca",
  storageBucket: "befit-3a7ca.firebasestorage.app",
  messagingSenderId: "44764302316",
  appId: "1:44764302316:web:c959737ad695b6f2690f99"
};

// SINGLETON PATTERN - Prevents double initialization
let app;
let auth;
let db;
let storage;

if (getApps().length === 0) {
  // First time initialization
  console.log('🔥 Initializing Firebase for the first time...');
  
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');

  if (Platform.OS === 'web') {
    auth = getAuth(app);
    console.log('✅ Auth initialized for Web');
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('✅ Auth initialized for React Native');
  }

  db = getFirestore(app);
  console.log('✅ Firestore initialized');

  storage = getStorage(app);
  console.log('✅ Storage initialized');
  
} else {
  // Reuse existing instance
  console.log('♻️ Reusing existing Firebase instance');
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;

// VetShield Firebase Integration Service
// Supports Cloud Firestore & Authentication
// NOTE: VetShield operates with Dual-Mode architecture:
// 1. Direct local Ingestion Gateway (ready out of the box for Wi-Fi hardware demos)
// 2. Cloud Firestore (enabled by entering your Firebase config credentials below)

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace with your project credentials from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderKeyForVetShield",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vetshield-college-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vetshield-college-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vetshield-college-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789"
};

let app = null;
let db = null;
let auth = null;
let isFirebaseConfigured = false;

try {
  // Only initialize if a non-placeholder key is provided
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('Placeholder')) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseConfigured = true;
    console.log('[VetShield Firebase] Successfully initialized Cloud Firestore & Auth.');
  } else {
    console.log('[VetShield Firebase] Running in Local Ingestion Gateway mode. Cloud Firestore sync is optional.');
  }
} catch (err) {
  console.warn('[VetShield Firebase] Initialization skipped or error:', err.message);
}

export { app, db, auth, isFirebaseConfigured };

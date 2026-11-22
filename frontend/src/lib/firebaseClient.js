/**
 * @file firebaseClient.js
 * @description Firebase Web SDK Client Setup & Auth Helper Utilities.
 * 
 * Responsibilities:
 * 1. Initializes Firebase app singleton.
 * 2. Exports auth instance and Google OAuth provider.
 * 3. Handles automatic Supabase user profile table synchronization.
 * 4. Sanitizes raw Firebase error codes into clean user-facing messages.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD7sfpiJ79kFVrzy0izsLOD_vfc9zqsR9g";
const isConfigured = Boolean(apiKey && apiKey.trim() && !apiKey.includes("dummy"));

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chatbook-68a8f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chatbook-68a8f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chatbook-68a8f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "815798702955",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:815798702955:web:cfa106c88585ef2d16f22e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YRS46KW4FJ",
};

let app = null;
let authInstance = null;
let googleProviderInstance = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
  googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  console.warn('[Firebase] Client initialization warning:', e?.message || e);
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const isFirebaseConfigured = isConfigured;

/**
 * Sanitizes Firebase raw technical error messages into clean, user-friendly natural text.
 * 
 * @param {Error|Object} err - Raw error object caught from Firebase SDK call.
 * @returns {string} Sanitized user-facing error message string.
 */
export function getCleanAuthErrorMessage(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const code = err.code || '';
  const message = err.message || '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain (chatbook-psi-brown.vercel.app) is not authorized in Firebase Console. Please add it to Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid or missing in Vercel environment variables. Please check VITE_FIREBASE_API_KEY and redeploy.';
    case 'auth/network-request-failed':
      return 'Network request failed. Please check your internet connection or backend connectivity.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in your Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid username/email or password, or account does not exist. Please check your credentials or switch to Sign Up.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please Sign In instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in operation was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/requires-recent-login':
      return 'Please log out and log in again to perform this action.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait a moment and try again.';
    default:
      if (message.includes('Firebase: Error')) {
        const match = message.match(/\((auth\/[^)]+)\)/);
        if (match) {
          return `Authentication failed: ${match[1]}. Please check your details and try again.`;
        }
        return 'Authentication failed. Please check your details and try again.';
      }
      return message || 'Authentication failed. Please try again.';
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  firebaseSignOut as signOut,
  onAuthStateChanged,
};

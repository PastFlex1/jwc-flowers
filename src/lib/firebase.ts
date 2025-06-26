// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For security, these values are stored in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all firebase config keys are provided
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => !!value && !value.includes('YOUR_'));

let app;
let db;

// This check is now more strict. If the configuration is incomplete,
// the app will stop immediately with a clear error message.
if (isFirebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
} else {
    throw new Error("La configuración de Firebase está incompleta. Por favor, verifique que todas las variables NEXT_PUBLIC_FIREBASE_* estén correctamente establecidas en su archivo .env.");
}


export { app, db };

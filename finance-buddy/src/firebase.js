import { initializeApp } from "firebase/app";
<<<<<<< HEAD
import { getAnalytics } from "firebase/analytics";
=======
>>>>>>> 4eedda9070128e835e3636d79701b2b498d2f11e
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

<<<<<<< HEAD
export const auth = getAuth(app);
=======
export const auth = getAuth(app)
>>>>>>> 4eedda9070128e835e3636d79701b2b498d2f11e
export const db = getFirestore(app)

console.log('Firebase initialized successfully')
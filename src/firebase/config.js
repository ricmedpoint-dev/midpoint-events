import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBtZ68kSRblrrNC7-RS8JSGpiuN5ZtbvRs",
  authDomain: "midpoint-events-webapp.firebaseapp.com",
  projectId: "midpoint-events-webapp",
  storageBucket: "midpoint-events-webapp.firebasestorage.app",
  messagingSenderId: "460251085974",
  appId: "1:460251085974:web:afa881d39dc675c1d596b7",
  measurementId: "G-CC1DMC41TV"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

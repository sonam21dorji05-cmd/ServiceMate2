import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA5ZS8cHaVCZ-EElLe6tss-SJR8h9q3ww4",
  authDomain: "servicemate-410fe.firebaseapp.com",
  projectId: "servicemate-410fe",
  storageBucket: "servicemate-410fe.firebasestorage.app",
  messagingSenderId: "499213049780",
  appId: "1:499213049780:web:488b40cc60b22c1fc09ce1"
};

// Reuse the app if it already exists (happens when the app hot-reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Keep the user logged in after the app closes. Newer Firebase versions export
// reactNativeLocalPersistence; older ones use getReactNativePersistence.
const authModule = FirebaseAuth as any;
const persistence =
  authModule.reactNativeLocalPersistence ??
  authModule.getReactNativePersistence(AsyncStorage);

function createAuth() {
  try {
    return FirebaseAuth.initializeAuth(app, { persistence });
  } catch {
    // Auth was already initialised by a previous reload
    return FirebaseAuth.getAuth(app);
  }
}

// Auto-detect long polling so Firestore connects reliably from Expo Go
function createDb() {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    // Firestore was already initialised by a previous reload
    return getFirestore(app);
  }
}

export const auth = createAuth();
export const db = createDb();
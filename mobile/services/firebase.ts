import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 🔧 Replace with your Firebase project config from:
// Firebase Console → Project Settings → Your Apps → Web App → Config
const firebaseConfig = {
  apiKey:            "AIzaSyCZsONi-wjBOSHtR4-iJnCecOULPpSpbeY",
  authDomain:        "xcash-831fc.firebaseapp.com",
  projectId:         "xcash-831fc",
  storageBucket:     "xcash-831fc.firebasestorage.app",
  messagingSenderId: "428819423614",
  appId:             "1:428819423614:web:21ec610319af1bd043132f",
  measurementId:     "G-BQ1C1W8R8Y",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = getAuth(app);
export default app;

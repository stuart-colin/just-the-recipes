// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics"; // Import isSupported and Analytics type
import { getFirestore, Firestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// Basic check to ensure environment variables are loaded, especially during development
if (process.env.NODE_ENV === 'development') {
  const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => key !== 'measurementId' && !value) // measurementId is optional
    .map(([key]) => `NEXT_PUBLIC_${key.replace(/([A-Z])/g, '_$1').toUpperCase().replace('FIREBASE__', 'FIREBASE_')}`); // Reconstruct env var name

  if (missingVars.length > 0) {
    console.warn(
      `Firebase Initialization Warning: The following environment variables are missing or empty:
      ${missingVars.join('\n      ')}
      Please ensure they are set in your .env.local file for local development.
      Firebase might not initialize correctly.`
    );
  }
}

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const analytics: Promise<Analytics | null> = isSupported().then(yes => yes ? getAnalytics(app) : null);
const db: Firestore = getFirestore(app);

// Export the db instance for use in other parts of your app
export { db, app, analytics };
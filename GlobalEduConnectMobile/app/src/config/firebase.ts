import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration - will be filled in by user
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
};

// Initialize Firebase
let firebaseApp: any = null;
let database: any = null;

try {
  firebaseApp = initializeApp(firebaseConfig);
  database = getDatabase(firebaseApp);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { firebaseApp, database };

/**
 * Instructions for setting up Firebase:
 * 
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Add a web app to your Firebase project
 * 3. Enable Realtime Database in your Firebase project
 * 4. Set up security rules for Realtime Database
 * 5. Add the Firebase configuration to your .env file:
 *    FIREBASE_API_KEY=your_api_key
 *    FIREBASE_AUTH_DOMAIN=your_auth_domain
 *    FIREBASE_DATABASE_URL=your_database_url
 *    FIREBASE_PROJECT_ID=your_project_id
 *    FIREBASE_STORAGE_BUCKET=your_storage_bucket
 *    FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
 *    FIREBASE_APP_ID=your_app_id
 */
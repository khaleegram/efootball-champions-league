import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountString) {
      throw new Error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to your .env file.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
     console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization error: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON object.', error.message);
    // Throwing the error will prevent the app from starting in a broken state.
    throw new Error('Firebase Admin SDK initialization failed. Check the server logs for details.');
  }
}

// These will now be safely available because the app would have crashed on startup if initialization failed.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

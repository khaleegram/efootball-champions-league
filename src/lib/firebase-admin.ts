import admin from 'firebase-admin';

// This file is for server-side code only.

// Check if the app is already initialized to prevent errors during hot-reloading in development.
if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountString) {
      throw new Error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for server-side authentication.');
  }

  try {
    // Parse the service account key from the environment variable.
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
     console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization error. Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid, single-line JSON string in your .env file.', error.message);
    // Throwing an error is critical here to prevent the app from running in a misconfigured state.
    throw new Error('Firebase Admin SDK failed to initialize. Check server logs for details.');
  }
}

// Export the initialized admin services.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

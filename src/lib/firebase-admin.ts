import admin from 'firebase-admin';

// Initialize only once
let adminApp: admin.app.App | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

const initializeFirebaseAdmin = () => {
  if (adminApp) return;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  // Validate critical variables
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  // **** KEY CHANGE HERE: Use privateKey directly after trimming whitespace ****
  const privateKey = FIREBASE_PRIVATE_KEY.trim();

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey, // Pass the privateKey string directly
      }),
    });

    adminDb = adminApp.firestore();
    adminAuth = adminApp.auth();

    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('🔥 Firebase initialization error:', error);
    // console.error('Problematic privateKey (debug only):', privateKey); // UNCOMMENT FOR DEBUGGING IF IT FAILS AGAIN
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
};

export const getAdminDb = (): admin.firestore.Firestore => {
  if (!adminDb) initializeFirebaseAdmin();
  return adminDb!;
};

export const getAdminAuth = (): admin.auth.Auth => {
  if (!adminAuth) initializeFirebaseAdmin();
  return adminAuth!;
};

// Export Firestore types for direct use
export { Timestamp, FieldValue } from 'firebase-admin/firestore';
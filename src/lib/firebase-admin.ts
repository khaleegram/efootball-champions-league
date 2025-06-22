'use server';

import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function ensureAdminInitialized(): void {
  if (admin.apps.length > 0 && admin.apps[0]) {
    adminApp = admin.apps[0];
    return;
  }
  
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is not set in the environment variables. Server-side features like creating tournaments will not work. Please go to your Firebase project settings, generate a new private key, and add it to your .env file.');
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/^'|'$/g, '');
    const serviceAccount = JSON.parse(serviceAccountString);
    
    // Let Firebase Admin infer the project ID from the credential itself.
    // This is more robust and avoids potential mismatches with other environment variables.
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.stack);
    throw new Error("Could not initialize Firebase Admin SDK. Your FIREBASE_SERVICE_ACCOUNT_KEY in the .env file might be a malformed JSON string. Please ensure it is a single line enclosed in single quotes, like `FIREBASE_SERVICE_ACCOUNT_KEY='{\"key\": \"value\" ...}'`.");
  }
}

function getAdminDb(): Firestore {
  ensureAdminInitialized();
  return admin.firestore(adminApp);
}

function getAdminAuth(): Auth {
  ensureAdminInitialized();
  return admin.auth(adminApp);
}

export { getAdminDb, getAdminAuth, admin };
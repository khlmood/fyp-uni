// api/_firebaseAdmin.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
  let svc;
  try {
    svc = JSON.parse(raw);
  } catch (err) {
    console.error('Invalid SERVICE_ACCOUNT JSON', err);
    throw err;
  }
  admin.initializeApp({
    credential: admin.credential.cert(svc),
  });
  console.log('✅ Firebase Admin initialized');
}

export const auth       = admin.auth();
export const db         = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseConfigInput {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function initFirebase(customConfig?: FirebaseConfigInput): { app: FirebaseApp | null; db: Firestore | null } {
  if (typeof window === 'undefined') {
    return { app: null, db: null };
  }

  const apiKey = customConfig?.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = customConfig?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return { app: null, db: null };
  }

  try {
    const config = {
      apiKey: apiKey,
      authDomain: customConfig?.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: customConfig?.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: customConfig?.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: customConfig?.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    firestoreDb = getFirestore(firebaseApp);
    return { app: firebaseApp, db: firestoreDb };
  } catch (err) {
    console.warn('Firebase no inicializado (usando modo reactivo local):', err);
    return { app: null, db: null };
  }
}

export function getDb(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const res = initFirebase();
  return res.db;
}

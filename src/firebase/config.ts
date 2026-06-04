import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { initAppCheck } from './appCheck';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** 플레이스홀더(예: 'your-...') 가 아닌 실제 값인지 검사 */
function isRealValue(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v.length === 0) return false;
  if (v.startsWith('your-')) return false;
  return true;
}

/** 모든 필수 Firebase 설정이 실제 값으로 채워졌는지 여부 */
export const hasRealConfig: boolean =
  isRealValue(firebaseConfig.apiKey) &&
  isRealValue(firebaseConfig.authDomain) &&
  isRealValue(firebaseConfig.projectId) &&
  isRealValue(firebaseConfig.appId);

export const useEmulator: boolean = env.VITE_USE_EMULATOR === 'true';

// 플레이스홀더라도 initializeApp 은 항상 호출(앱이 크래시되지 않도록).
export const app: FirebaseApp = initializeApp({
  apiKey: firebaseConfig.apiKey ?? 'placeholder-api-key',
  authDomain: firebaseConfig.authDomain ?? 'placeholder.firebaseapp.com',
  projectId: firebaseConfig.projectId ?? 'placeholder-project',
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ?? 'placeholder-app-id',
});

// 순서: initializeApp -> (App Check, 에뮬레이터가 아닐 때만) -> getFirestore/getAuth
if (!useEmulator) {
  initAppCheck(app);
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

if (useEmulator) {
  // 에뮬레이터 경로: App Check 건너뜀
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

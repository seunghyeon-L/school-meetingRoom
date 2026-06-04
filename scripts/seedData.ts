/**
 * Firestore 초기 데이터 시드 스크립트.
 *
 * 자동 실행되지 않습니다. 아래 방법 중 하나로 실행하세요.
 *
 * 1) 에뮬레이터에 시드 (권장, 로컬 개발):
 *    - 다른 터미널에서: npx firebase-tools emulators:start
 *    - 환경변수 설정 후 실행:
 *        $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
 *        $env:VITE_FIREBASE_PROJECT_ID="demo-project"
 *        npx tsx scripts/seedData.ts
 *
 * 2) 실제 Firebase 프로젝트에 시드:
 *    - .env 에 실제 VITE_FIREBASE_* 값을 채운 뒤(이 스크립트는 .env 를 직접
 *      읽지 않으므로) 아래 환경변수를 직접 지정해서 실행하세요.
 *        $env:VITE_FIREBASE_API_KEY="..."
 *        $env:VITE_FIREBASE_PROJECT_ID="..."
 *        $env:VITE_FIREBASE_APP_ID="..."
 *        $env:VITE_FIREBASE_AUTH_DOMAIN="..."
 *        npx tsx scripts/seedData.ts
 *      (firestore.rules 의 write:false 때문에 클라이언트 SDK 로 rooms/users 를
 *       직접 쓰는 것은 거부됩니다. 실제 프로젝트에서는 Firebase 콘솔에서 수동
 *       입력하거나, 규칙을 임시 완화하거나, Admin SDK 를 사용하세요.
 *       에뮬레이터에서는 규칙이 적용되더라도 demo 프로젝트로 우회 가능합니다.)
 *
 * 입력 데이터: 회의실 3개(419/420/424호), 조교 2명(오은희/문하경).
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-project';
const useEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
  projectId,
  appId: process.env.VITE_FIREBASE_APP_ID ?? 'demo-app-id',
});

const db = getFirestore(app);

if (useEmulator) {
  const [host, portStr] = (process.env.FIRESTORE_EMULATOR_HOST ?? '').split(':');
  connectFirestoreEmulator(db, host || '127.0.0.1', Number(portStr) || 8080);
}

const rooms = [
  { id: 'room-419', name: '419호', order: 1, active: true },
  { id: 'room-420', name: '420호', order: 2, active: true },
  { id: 'room-424', name: '424호', order: 3, active: true },
];

const users = [
  { id: 'asst-oeh', name: '오은희', title: '조교', order: 1, active: true },
  { id: 'asst-mhk', name: '문하경', title: '조교', order: 2, active: true },
] as const;

async function main(): Promise<void> {
  console.log(`[seed] projectId=${projectId}, emulator=${useEmulator}`);

  for (const room of rooms) {
    const { id, ...data } = room;
    await setDoc(doc(db, 'rooms', id), data);
    console.log(`[seed] room: ${data.name}`);
  }

  for (const user of users) {
    const { id, ...data } = user;
    await setDoc(doc(db, 'users', id), data);
    console.log(`[seed] user: ${data.name} (${data.title})`);
  }

  console.log('[seed] 완료');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] 실패:', err);
    process.exit(1);
  });

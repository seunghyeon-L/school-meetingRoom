import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from './config';

let signInStarted = false;

/**
 * 익명 로그인 보장. 한 번만 signInAnonymously 를 시도한다.
 * 반환된 Promise 로 실패를 감지할 수 있다(상위에서 ready 처리해 앱이 멈추지 않게 함).
 * 플레이스홀더/네트워크 문제로 실패할 수 있다.
 */
export function ensureAnonAuth(): Promise<void> {
  if (signInStarted) return Promise.resolve();
  signInStarted = true;
  return signInAnonymously(auth)
    .then(() => undefined)
    .catch((err) => {
      console.error('익명 로그인 실패:', err);
      throw err;
    });
}

/**
 * 인증 상태 구독. 로그인이 완료되어 uid 가 생긴 시점에만 ready=true 로 알린다.
 * (로그인 전에 Firestore 를 읽어 권한 오류가 나는 최초 로드 레이스를 방지)
 */
export function subscribeAuth(cb: (uid: string) => void): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) cb(user.uid);
  });
}

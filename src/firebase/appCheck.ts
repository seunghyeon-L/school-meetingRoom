import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { hasRealConfig } from './config';

const env = import.meta.env;

function isRealValue(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  return v.length > 0 && !v.startsWith('your-');
}

/**
 * App Check 초기화.
 * - 실제 Firebase 설정 + 실제 reCAPTCHA 사이트 키가 모두 있을 때만 동작.
 * - DEV 환경에서는 initializeAppCheck 호출 전에 디버그 토큰을 켠다.
 */
export function initAppCheck(app: FirebaseApp): void {
  const siteKey = env.VITE_RECAPTCHA_SITE_KEY;

  if (!hasRealConfig || !isRealValue(siteKey)) {
    // 플레이스홀더 환경에서는 App Check 를 건너뛰어 크래시를 방지.
    return;
  }

  if (env.DEV) {
    // App Check 디버그 토큰 (개발 전용). 유일하게 허용된 any 사용 지점.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey as string),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // App Check 실패가 앱 전체를 멈추게 하지 않도록 방어.
    console.error('App Check 초기화 실패:', err);
  }
}

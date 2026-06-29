import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PWA(서비스워커) 완전 제거.
// 이 앱은 PWA 가 필요 없고, 이전의 서비스워커가 navigateFallback 으로 /_/(PocketBase 관리자)를
// 가로채는 문제가 반복됐다. selfDestroying 모드로도 SW 를 한 번은 등록하기 때문에 캐시된 옛 SW 가
// 되살아날 여지가 있었다. 그래서 vite-plugin-pwa 자체를 빼서 빌드 결과에 sw.js / registerSW.js 가
// 아예 생기지 않도록 한다 => 앱이 서비스워커를 절대 등록하지 않음(한 번 정리하면 영구 해결).
export default defineConfig({
  plugins: [react()],
});

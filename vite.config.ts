import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // PWA(서비스워커) 제거.
    // 이전에 배포된 서비스워커가 navigateFallback 으로 모든 경로(/_/ 관리자 포함)를
    // 앱(index.html)으로 가로채던 문제가 있었다. 또한 이 앱은 PWA 가 필요 없다.
    // selfDestroying 모드: 기존에 등록된 SW 를 스스로 unregister 하고 캐시를 비우는
    // "자기파괴" 서비스워커를 한 번 배포해, 모든 기기에서 SW 를 깨끗이 제거한다.
    VitePWA({ selfDestroying: true }),
  ],
});

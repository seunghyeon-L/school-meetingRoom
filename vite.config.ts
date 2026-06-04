import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// API endpoints that must NEVER be cached/precached by the service worker.
// These are network-only so Firebase auth / firestore / app-check always hit the network.
const networkOnlyApiPatterns: RegExp[] = [
  /^https:\/\/firestore\.googleapis\.com\/.*/i,
  /^https:\/\/firebaseinstallations\.googleapis\.com\/.*/i,
  /^https:\/\/firebaseappcheck\.googleapis\.com\/.*/i,
  /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
  /^https:\/\/securetoken\.googleapis\.com\/.*/i,
  /^https:\/\/www\.google\.com\/recaptcha\/.*/i,
  /^https:\/\/www\.gstatic\.com\/recaptcha\/.*/i,
];

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '제주대학교 회의실 예약',
        short_name: '회의실예약',
        description: '학과 회의실 예약 시스템',
        lang: 'ko',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#024ad8',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: networkOnlyApiPatterns,
        runtimeCaching: networkOnlyApiPatterns.map((urlPattern) => ({
          urlPattern,
          handler: 'NetworkOnly' as const,
        })),
      },
    }),
  ],
});

/**
 * Root Fact App — Service Worker
 * Handles precaching of app shell and model files,
 * plus runtime caching for CDN resources and AI model downloads.
 */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// ========================================
// 1. Precache App Shell & Model Files
// ========================================
// self.__WB_MANIFEST is replaced by Workbox with the precache manifest
// This includes: HTML, CSS, JS bundles, model.json, weights.bin, metadata.json, icons
precacheAndRoute(self.__WB_MANIFEST);

// ========================================
// 2. Runtime Cache: CDN Resources (TF.js, Fonts, etc.)
// ========================================
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'cdn-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ========================================
// 3. Runtime Cache: Google Fonts
// ========================================
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// ========================================
// 4. Runtime Cache: Hugging Face AI Model Files
// ========================================
registerRoute(
  ({ url }) =>
    url.hostname.includes('huggingface.co') ||
    url.hostname.includes('hf.co') ||
    url.hostname.includes('cdn-lfs'),
  new CacheFirst({
    cacheName: 'hf-ai-models',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ========================================
// 5. Runtime Cache: TensorFlow Hub Model Files
// ========================================
registerRoute(
  ({ url }) =>
    url.hostname.includes('tfhub.dev') ||
    url.hostname.includes('kaggle.com') ||
    url.hostname.includes('storage.googleapis.com'),
  new CacheFirst({
    cacheName: 'tf-models',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ========================================
// 6. Activate immediately & claim clients
// ========================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

console.log('[SW] Root Fact App Service Worker loaded');

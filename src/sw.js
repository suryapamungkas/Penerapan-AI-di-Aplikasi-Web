/**
 * Root Fact App — Service Worker
 * Handles precaching of app shell and model files,
 * plus runtime caching for CDN resources and AI model downloads.
 */
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// ========================================
// 1. Precache App Shell & Model Files
// ========================================
const manifest = self.__WB_MANIFEST || [];
precacheAndRoute(manifest);

// ========================================
// 2. Navigation fallback for offline (SPA)
// ========================================
try {
  // Dynamically find index.html in precache list (handles absolute/relative paths)
  const indexEntry = manifest.find(entry => entry.url && entry.url.endsWith('index.html'));
  const indexUrl = indexEntry ? indexEntry.url : 'index.html';

  const handler = createHandlerBoundToURL(indexUrl);
  const navigationRoute = new NavigationRoute(handler, {
    denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
  });
  registerRoute(navigationRoute);
} catch (e) {
  console.warn('Navigation fallback error:', e);
}

// ========================================
// 3. Runtime Cache: CDN Resources (TF.js, Transformers.js)
// ========================================
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'cdn-resources',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ========================================
// 4. Runtime Cache: Google Fonts
// ========================================
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// ========================================
// 5. Runtime Cache: Hugging Face AI Models
// ========================================
registerRoute(
  ({ url }) => url.hostname.includes('huggingface.co') || url.hostname.includes('hf.co') || url.hostname.includes('cdn-lfs'),
  new CacheFirst({
    cacheName: 'hf-ai-models',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ========================================
// 6. Runtime Cache: TensorFlow Hub
// ========================================
registerRoute(
  ({ url }) => url.hostname.includes('tfhub.dev') || url.hostname.includes('kaggle.com') || url.hostname.includes('storage.googleapis.com'),
  new CacheFirst({
    cacheName: 'tf-models',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ========================================
// 7. Activate immediately & claim clients
// ========================================
self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

console.log('[SW] Root Fact App Service Worker loaded');

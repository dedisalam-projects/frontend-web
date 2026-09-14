---
name: zero-overhead-pwa
description: "Use when configuring Progressive Web App (PWA) installability and offline caching for SPAs or micro-frontends without adding heavy framework bundle dependencies."
tier: local
target-stacks: ["web", "pwa", "service-worker", "vanilla-js", "angular", "react", "vue"]
metadata:
  origin: auto-extracted
---

# Zero-Overhead Progressive Web App (PWA)

**Extracted:** 2026-09-14
**Context:** Implementing PWA installability, web app manifests, and offline service worker caching for modern SPAs and micro-frontends without bloating the initial JavaScript bundle.

## Problem
Adding heavy framework-specific PWA packages (e.g. `@angular/pwa` or bulky bundler plugins) injects 15–25 KB of runtime code directly into the critical path. For micro-frontends and performance-sensitive landing pages, this degrades First Contentful Paint (FCP), Largest Contentful Paint (LCP), and triggers bundle budget warnings.

## Solution

Implement a native, framework-agnostic PWA with zero initial JavaScript overhead:

### 1. Web App Manifest (`public/manifest.webmanifest`)
Provide complete metadata and standard display properties:
```json
{
  "name": "App Name",
  "short_name": "App",
  "description": "Application Suite",
  "start_url": "/",
  "id": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. High-Resolution Icon Set
Ensure `public/icons/` includes:
- `icon-192.png` (192x192 PNG)
- `icon-512.png` (512x512 PNG)
- `icon-maskable-512.png` (512x512 PNG with an 80% diameter safe-zone padding)
- `apple-touch-icon.png` (180x180 PNG)

### 3. Lightweight Service Worker (`public/sw.js`)
Use a minimal vanilla Service Worker (< 1.5 KB) handling precache and runtime requests:
```javascript
const CACHE_NAME = 'app-shell-v1';
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/favicon.ico'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

    // Navigation requests: Network-First with cache fallback (offline status 200)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    if (res && res.status === 200) {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
        );
        return;
    }

    // Static assets: Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((netRes) => {
                if (netRes && netRes.status === 200) {
                    const copy = netRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return netRes;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
```

### 4. Deferred Non-Blocking Registration (`index.html`)
Register the Service Worker after the window load event to prevent competing for critical render bandwidth:
```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#10b981" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

<script>
    if ('serviceWorker' in navigator) {
        if (document.readyState === 'complete') {
            navigator.serviceWorker.register('/sw.js').catch(function () {});
        } else {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
        }
    }
</script>
```

## When to Use
- When making an Angular, React, Vue, or Vanilla web app installable as a PWA.
- When passing Lighthouse PWA and offline audits without adding bundle overhead.
- When containerizing or serving micro-frontends with independent offline caching strategies.

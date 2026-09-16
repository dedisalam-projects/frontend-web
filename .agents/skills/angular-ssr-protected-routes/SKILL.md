---
name: angular-ssr-protected-routes
description: "Use when encountering flash of unauthorized content before auth redirect in Angular SSR, or when configuring server route render modes for authenticated application shells — prevent server prerendering of protected views with hybrid CSR and pre-bootstrap splash indicators."
tier: local
target-stacks: ["angular", "node", "ssr"]
metadata:
  origin: auto-extracted
---

# Angular SSR Protected Routes & Anti-Flash Architecture

**Extracted:** 2026-09-14  
**Context:** Prevents unauthorized UI flashing, data leakage, and blank screen flickers when accessing authentication-gated routes in Angular 17+ / 19+ / 22+ Server-Side Rendered (SSR) applications.

## Problem

When using `@angular/ssr` on private or dashboard applications:
1. **Server Route Misconfiguration**: If `app.routes.server.ts` uses `RenderMode.Prerender` or unconstrained `RenderMode.Server` on protected routes (`**`), the server builds or renders the protected component tree into the initial static HTML response.
2. **Permissive SSR Guards**: If an `authGuard` falls back to `return true;` in a non-browser context (`typeof window === 'undefined'`), the server renders layout, sidebars, charts, and widgets into the initial HTTP payload.
3. **Flash of Unauthorized Content (FOUC)**: Unauthenticated users requesting the protected URL receive a rendered dashboard HTML page (~160 KB). The browser paints this layout immediately. Only after client JavaScript boots (~300ms–1s later) does the guard trigger `window.location.href = .../login`, causing a jarring UI flash and potential data leak.

## Solution

Apply the three-part **Hybrid CSR & App Shell Loading** pattern:

### 1. Configure Server Routes for Client-Side Rendering (CSR)
In `projects/<app>/src/app.routes.server.ts`, set the render mode of authenticated routes to `RenderMode.Client`:

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    {
        path: '**',
        renderMode: RenderMode.Client
    }
];
```
- **Result**: The SSR engine serves only the lightweight `index.html` shell without rendering protected components on the server. Public pages (e.g. landing pages) can still use `RenderMode.Prerender` or `RenderMode.Server` in their respective projects.

### 2. Harden Auth Guard SSR Fallback
In `projects/<app>/src/app/guards/auth.guard.ts`, strictly deny route activation on the server:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken') || getCookie('accessToken');
        if (token && isTokenValid(token)) {
            return true;
        }

        // Clean up and redirect to login
        window.location.href = `${environment.appUrls.auth}/login`;
        return false;
    }

    // SSR fallback: Deny server rendering for protected routes
    return false;
};
```

### 3. Embed Pre-Bootstrap App Shell Splash Screen
In `projects/<app>/src/index.html`, place pure inline CSS and a loading spinner directly inside `<app-root>`:

```html
<head>
    <style>
        .app-splash-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 99999;
        }
        .app-splash-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(16, 185, 129, 0.15);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: app-splash-spin 0.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .app-splash-text {
            margin-top: 1.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: #64748b;
            animation: app-splash-pulse 1.8s ease-in-out infinite;
        }
        @keyframes app-splash-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes app-splash-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        @media (prefers-color-scheme: dark) {
            .app-splash-screen { background-color: #0f172a; }
            .app-splash-spinner { border-color: rgba(52, 211, 153, 0.2); border-top-color: #34d399; }
            .app-splash-text { color: #94a3b8; }
        }
    </style>
</head>
<body>
    <app-root>
        <div class="app-splash-screen" role="status" aria-live="polite" aria-label="Loading application">
            <div class="app-splash-spinner"></div>
            <div class="app-splash-text">Loading...</div>
        </div>
    </app-root>
</body>
```

- **0ms Render**: Browser paints the spinner immediately on the first frame.
- **Unauthenticated Flow**: Spinner displays for ~200–400ms, then smoothly redirects to login without showing the dashboard.
- **Authenticated Flow**: Spinner displays until Angular bootstraps, then `<app-root>` content is replaced with the active dashboard view without blank flashes.

### 3.1. Universal Brand-Neutral Micro-Frontend Loading Copy
Across all micro-frontends in the workspace (Dashboard, Landing, Auth):
- **Standardized Text**: Always use the clean, universal string `<div class="app-splash-text">Loading...</div>` and `aria-label="Loading application"`.
- **Anti-Jitter Across Cross-Port Navigation**: Never use app-specific names (e.g., `Loading Dashboard...`, `Memuat PrimeLand...`). When a browser redirects or navigates across micro-frontend ports (e.g., Port 4000 -> Port 4002), differing splash copy causes jarring visual text shifts. An identical splash shell creates a seamless single-application experience.

### 4. Critical Inline Anti-FOUC Splash for Prerendered & SSG Routes

On routes configured with `RenderMode.Prerender` or `RenderMode.Server` (e.g. `/login`), the server sends prerendered HTML directly inside `<app-root>`. External CSS bundles may take 100–300ms to download, and frameworks like PrimeNG inject 20+ `<style>` tags dynamically via JS **after** Angular bootstrap. This creates two FOUC windows that require separate fixes.

#### Root Cause Analysis

| Stage | What happens | FOUC risk |
|---|---|---|
| 0ms | Browser receives SSR HTML with `<app-root>` content | SSR content painted without CSS |
| ~200ms | `styles.css` loads (static `<link>`) | Layout CSS arrives |
| ~400ms | Angular bootstraps, `afterNextRender` fires | ✅ Angular render complete |
| ~400ms+ | PrimeNG injects 20+ `<style>` + `@font-face` tags via JS | ❌ Icon font download starts AFTER this |
| variable | `primeicons.woff2` fully downloaded | ✅ Icons renderable |
| `window.load` | ALL resources complete (CSS, JS, fonts, images) | ✅ Guaranteed complete |

**The definitive guarantee**: `afterNextRender` ensures Angular is rendered, `window.load` ensures ALL network resources (including font files) are downloaded. Only when BOTH have fired is the page truly ready to reveal.

#### Complete Fix: 3-Part Pattern

**Part 1 — `index.html`: Splash overlay + hide `app-root` + expose dismiss hook**

```html
<style>
    #app-splash-loader {
        position: fixed; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        background-color: #f8fafc; z-index: 999999;
        transition: opacity 0.3s ease-out, visibility 0.3s ease-out;
    }
    @media (prefers-color-scheme: dark) {
        #app-splash-loader { background-color: #09090b; }
    }
    .splash-spinner {
        width: 44px; height: 44px;
        border: 3.5px solid rgba(16, 185, 129, 0.18);
        border-top-color: #10b981; border-radius: 50%;
        animation: splash-spin 0.75s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }
    @keyframes splash-spin { to { transform: rotate(360deg); } }
    /* CRITICAL: Hide SSR raw HTML until Angular + all styles are ready */
    body:not(.app-loaded) app-root { visibility: hidden; }
    .app-loaded #app-splash-loader { opacity: 0; visibility: hidden; pointer-events: none; }
</style>
<body>
    <div id="app-splash-loader" role="status" aria-label="Loading application">
        <div class="splash-spinner"></div>
        <div class="splash-text">Loading...</div>
    </div>
    <app-root></app-root>
    <script>
        // Promise that resolves when ALL resources are downloaded (CSS, fonts, images, JS)
        // This is the guarantee: window.load fires only after every network request completes.
        window.__loadPromise = new Promise(function (resolve) {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve, { once: true });
            }
        });

        // Called by Angular after BOTH afterNextRender AND window.load have fired
        window.__dismissSplash = function () {
            requestAnimationFrame(function () {
                document.body.classList.add('app-loaded');
            });
        };
        // Fallback: if Angular fails to bootstrap within 8 seconds
        var _splashFallback = setTimeout(window.__dismissSplash, 8000);
        window.__splashClearFallback = function () { clearTimeout(_splashFallback); };

        if ('serviceWorker' in navigator) {
            window.__loadPromise.then(function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
        }
    </script>
</body>
```

> ⚠️ **Critical**: Use `body.app-loaded` (NOT `html.app-loaded`) because `document.body.classList` is used. The CSS selector must match.

**Part 2 — `app.ts` root component: Dismiss after all styles are ready**

```typescript
import { afterNextRender, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class App {
    constructor() {
        const platformId = inject(PLATFORM_ID);
        if (isPlatformBrowser(platformId)) {
            afterNextRender(() => {
                const w = window as unknown as Record<string, unknown>;
                // Guarantee: wait for ALL resources downloaded (window.load)
                // AND Angular finished rendering (afterNextRender).
                // window.load ensures CSS, fonts, images all complete — no race condition.
                const loadPromise = (w['__loadPromise'] as Promise<void>) ?? Promise.resolve();
                loadPromise.then(() => {
                    // All resources downloaded. Force synchronous style + layout flush.
                    void document.body.offsetHeight;
                    // Single rAF: paint the fully-ready layout.
                    requestAnimationFrame(() => {
                        (w['__splashClearFallback'] as (() => void) | undefined)?.();
                        (w['__dismissSplash'] as (() => void) | undefined)?.();
                    });
                });
            });
        }
    }
}
```

> **Why `Promise.all([afterNextRender, window.load])` is the definitive guarantee:**
> - `afterNextRender` alone: Angular rendered ✅, but fonts may still be downloading ❌
> - `window.load` alone: all resources downloaded ✅, but Angular may not have rendered yet ❌  
> - **Both together**: Angular rendered AND all CSS/fonts/images downloaded ✅✅
> - `window.load` is the browser's contract that **every** network resource the page needs is complete — including `primeicons.woff2`, `styles.css`, and lazy-loaded chunks.
> - `void document.body.offsetHeight` after both guarantees the style recalculation happens with all real fonts and styles available.

> ⚠️ **Fallback timeout**: Set to 8s (not 4s) to accommodate slow connections. If Angular fails to bootstrap within 8s, the splash will dismiss anyway to avoid an infinite loading state.

**Part 3 — Dismiss chain summary**

```
index.html parsed
  → __loadPromise created (resolves on window.load)
  → splash shown, app-root hidden
  → Angular downloads main.js (fresh on hard reload)
    → afterNextRender()              ← Angular rendered + PrimeNG styles in DOM
      → await __loadPromise          ← window.load: ALL resources downloaded
        → void offsetHeight          ← synchronous reflow with all real fonts
          → rAF                      ← browser paints committed result
            → __dismissSplash()      ← body.app-loaded, splash fades out
```

#### Anti-Patterns to Avoid

| ❌ Wrong | ✅ Correct |
|---|---|
| `window.addEventListener('load', dismiss)` (too early) | `afterNextRender → await __loadPromise → reflow → rAF` |
| `afterNextRender` alone (fonts may still download) | `afterNextRender` + `window.load` both required |
| `document.fonts.ready` alone (race on hard reload) | `window.load` covers all font downloads unconditionally |
| `document.documentElement.classList.add('app-loaded')` | `document.body.classList.add('app-loaded')` |
| `html.app-loaded #splash { ... }` selector | `body.app-loaded #splash { ... }` selector |
| Missing `body:not(.app-loaded) app-root { visibility: hidden }` | Always hide `app-root` until fully styled |
| Fixed `rAF → rAF` (guessing frame count) | `void offsetHeight` forces synchronous flush — truly dynamic |

## When to Use

- When unauthenticated users see a momentary flash of dashboard UI before being redirected to login.
- When prerendered or SSG public routes (e.g. `/login`) suffer from Flash of Unstyled Content (FOUC) while waiting for external CSS bundles.
- When PrimeNG dynamic `<style>` tag injection causes font/icon differences visible for <100ms after Angular bootstrap.
- When configuring Angular 17+ / 19+ / 22+ multi-project workspaces with hybrid public (SSR/SSG) and private (CSR) micro-frontends.
- When optimizing First Contentful Paint (FCP), Cumulative Layout Shift (CLS: 0.000), and eliminating white-screen flashes.



> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `angular-ssr-protected-routes` conventions outlined above to ensure workspace consistency and prevent regressions.

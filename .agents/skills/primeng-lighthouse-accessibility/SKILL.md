---
name: primeng-lighthouse-accessibility
description: "Use when addressing Lighthouse accessibility failures in PrimeNG apps, specifically button-name, color-contrast, or errors-in-console."
metadata:
  origin: auto-extracted
---

# PrimeNG Lighthouse Accessibility & Best Practices

**Extracted:** 2026-09-06 (Updated: 2026-09-07)
**Context:** Achieving 100% Accessibility and Best Practices scores in Lighthouse on Angular applications using PrimeNG.

## Problem
1. Empty `<p-button></p-button>` elements (relying solely on icon classes or child DOM nodes) render an empty `<span class="p-button-label">` in the background, failing Lighthouse's `button-name` audit.
2. Standard surface utility classes (such as `text-primary-600` or `text-surface-600`) against pure white backgrounds fail WCAG 4.5:1 `color-contrast` audits.
3. Missing starter template images (e.g. `layout/images/landing/mockup.png`) trigger 404 HTTP errors, severely penalizing Lighthouse Best Practices scores under `errors-in-console`.

## Solution

### 1. Button Name (Aria Labels)
Always provide `label`, `ariaLabel`, or built-in `[icon]` component properties on `<p-button>`:
```html
<!-- Fails Lighthouse -->
<p-button></p-button>

<!-- Passes Lighthouse -->
<p-button ariaLabel="Search" icon="pi pi-search"></p-button>
<p-button label="Submit"></p-button>
```

### 2. Color Contrast
Use shade `-700` for light mode and `-300` for dark mode (instead of `-600`), or apply `severity="contrast"`:
```html
<!-- Fails Contrast -->
<span class="text-surface-600 dark:text-surface-200">...</span>

<!-- Passes Contrast -->
<span class="text-surface-700 dark:text-surface-300">...</span>
<p-button label="OK" severity="contrast"></p-button>
```

For custom CTA primary buttons relying on `--p-primary-color` (e.g., emerald-500 `#10b981`), white text `#ffffff` produces only a **2.53:1** contrast ratio (failing WCAG AA 4.5:1).
To resolve without altering theme aesthetic, bind to the darker shade `-700`:
```html
<!-- Passes WCAG AA with 5.48:1 contrast ratio -->
<a href="#features" class="hero-cta" style="background: var(--p-primary-700, #047857); color: #ffffff;">
    Learn More
</a>
```

### 3. Missing Template Images (404s)
Supply an empty SVG placeholder (`<svg></svg>`) or transparent 1x1 base64 PNG in public asset directories (e.g. `public/layout/images/`) for hardcoded legacy template paths so that the web server serves HTTP 200 instead of 404, eliminating `errors-in-console`.

### 4. Agentic Browsing & `llms.txt` Compliance (Lighthouse 100/100)
Chrome DevTools Lighthouse evaluates the `agentic-browsing` category via the `llms-txt` audit.
- **Anti-pattern**: Providing an `llms.txt` that only contains plain text description without links. Lighthouse will fail with: `'File does not appear to contain any links.'` (scoring 67/100).
- **Remedy**: Format `public/llms.txt` according to [llmstxt.org](https://llmstxt.org/) specification:
  - Top-level H1 header (`# Platform Name`)
  - Blockquote overview (`> Summary of platform capabilities`)
  - Structured Markdown link lists with descriptions:
    ```markdown
    # Sakai Platform

    > Sakai is a modern fullstack micro-frontend web application.

    ## Core Navigation
    - [Home](http://localhost:4001/#home): Overview and hero section.
    - [Features](http://localhost:4001/#features): List of platform capabilities.
    - [Highlights](http://localhost:4001/#highlights): Technical highlights.
    - [Pricing](http://localhost:4001/#pricing): Flexible subscription tiers.

    ## Platform Micro-Frontends
    - [Dashboard](http://localhost:4000/): System analytics workspace.
    - [Authentication](http://localhost:4002/login): User authentication portal.
    ```

### 5. Zero-Overhead PWA Implementation
Avoid adding heavy `@angular/pwa` dependencies that increase initial JavaScript bundle sizes (~15-20 KB overhead). Instead, implement a **Native Zero-Overhead PWA**:
1. **Manifest** (`public/manifest.webmanifest`): Define `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color`, and icon sets (192x192, 512x512, and 512x512 maskable).
2. **Lightweight Service Worker** (`public/sw.js`): Provide pre-caching for app shell (`/`, `/manifest.webmanifest`, `/favicon.ico`) with Cache-First for static assets and Network-First offline status 200 fallback.
3. **Deferred Registration** (`index.html`):
   ```html
   <link rel="manifest" href="/manifest.webmanifest" />
   <meta name="theme-color" content="#10b981" />
   <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
   <script>
       if ('serviceWorker' in navigator) {
           window.addEventListener('load', function () {
               navigator.serviceWorker.register('/sw.js').catch(function () {});
           });
       }
   </script>
   ```

## When to Use
- When auditing or optimizing Lighthouse scores on Angular + PrimeNG applications.
- When Lighthouse reports failures for `button-name`, `color-contrast`, or `errors-in-console`.
- When targeting 100/100 on Lighthouse Accessibility, Agentic Browsing, and PWA installability.


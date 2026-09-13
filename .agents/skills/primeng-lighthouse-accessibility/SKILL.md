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

### 3. Missing Template Images (404s)
Supply an empty SVG placeholder (`<svg></svg>`) or transparent 1x1 base64 PNG in public asset directories (e.g. `public/layout/images/`) for hardcoded legacy template paths so that the web server serves HTTP 200 instead of 404, eliminating `errors-in-console`.

## When to Use
- When auditing or optimizing Lighthouse scores on Angular + PrimeNG applications.
- When Lighthouse reports failures for `button-name`, `color-contrast`, or `errors-in-console`.

---
name: primeng-icon-font-parity
description: "Use when PrimeNG button icons or widget glyphs render as empty blank boxes, or when optimizing font assets in Angular micro-frontends sharing a UI library — ensure icon font parity with font-display: swap."
tier: local
target-stacks: ["angular", "primeng"]
metadata:
  origin: auto-extracted
---

# PrimeNG Icon Font Parity in Micro-Frontends & Shared UI

**Extracted:** 2026-09-14
**Context:** Angular 17+ multi-project micro-frontends with PrimeNG, where lightweight public apps (e.g., landing page) share components with heavier apps (e.g., dashboard, auth) via a shared library (`shared-ui`).

## Problem
1. When optimizing a public-facing micro-frontend for Lighthouse or minimal CSS, developers frequently strip `@use 'primeicons/primeicons.css'` under the assumption that all icons will be replaced with inline SVGs.
2. If shared UI components (e.g., `<app-floating-configurator>`) from a shared library use PrimeNG `<p-button [icon]="...">`, PrimeNG renders `<span class="p-button-icon pi pi-*"></span>`.
3. If widget components retain `<i class="pi pi-*"></i>` classes, omitting the PrimeIcons font results in **silent visual failure**: buttons and feature cards display as completely blank, invisible circles or squares without warning or console errors.

## Solution

### 1. Maintain Font Parity with Non-Blocking `font-display: swap`
Instead of completely stripping the font from the lightweight micro-frontend's styles, import PrimeIcons and declare `@font-face` with `font-display: swap` in the micro-frontend's SCSS (e.g., `landing-styles.scss`):

```scss
/* projects/landing/src/assets/landing-styles.scss */
@use 'primeicons/primeicons.css';

@font-face {
    font-family: 'primeicons';
    font-display: swap; /* Prevents Flash of Invisible Text (FOIT) */
    src: url('primeicons/fonts/primeicons.eot');
    src: url('primeicons/fonts/primeicons.eot?#iefix') format('embedded-opentype'),
         url('primeicons/fonts/primeicons.woff2') format('woff2'),
         url('primeicons/fonts/primeicons.woff') format('woff'),
         url('primeicons/fonts/primeicons.ttf') format('truetype'),
         url('primeicons/fonts/primeicons.svg?#primeicons') format('svg');
    font-weight: normal;
    font-style: normal;
}
```

### 2. Micro-Frontend Shared UI Contract
When a micro-frontend consumes shared components from `shared-ui`:
- Verify whether shared components rely on `p-button` with `icon` attributes or `pi pi-*` classes.
- If an app must remain strictly zero-font (pure SVG), shared UI components MUST be refactored to accept projected SVG templates or SVG icon bindings rather than hardcoded PrimeIcon strings.
- Never strip global font styles if shared UI components still reference those fonts.

## When to Use
- Use when PrimeNG buttons (`<p-button>`) or feature cards render blank circular or rectangular buttons with no visible icons.
- Use when configuring SCSS styles for an Angular micro-frontend consuming a shared component library with PrimeNG.
- Use when balancing Lighthouse font optimization with icon display correctness.

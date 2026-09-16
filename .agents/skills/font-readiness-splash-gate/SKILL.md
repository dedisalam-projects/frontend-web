---
name: font-readiness-splash-gate
description: "Use when custom web fonts or icon fonts glitch, flicker, or shift layout upon splash screen dismissal, or when font glyphs load after components mount — gate splash dismissal on document.fonts.ready and ensure complete font weight parity in critical preloads."
tier: local
target-stacks: ["angular", "web-performance", "css"]
metadata:
  origin: auto-extracted
---

# Font-Readiness Splash Gate & Complete Weight Parity

**Extracted:** 2026-09-15  
**Context:** SPAs with splash screens using custom web fonts (e.g. Lato, Roboto) and icon glyph fonts (PrimeIcons, FontAwesome), where text or icons flicker/shift immediately after the splash screen disappears.

## Problem

1. **Incomplete Weight Parity in Preloads:** Preloading only base font weights (e.g. 400/700) while components above the fold use other weights (e.g. 300 `font-light`) causes the browser to lazily fetch missing weights *after* splash dismissal, resulting in a visible FOUT (Flash of Unstyled Text) font glitch.
2. **Icon Font Discovery Delay:** Icon fonts (`primeicons.woff2`) referenced in SCSS are discovered late in the pipeline, rendering empty circles or square placeholders on first display.
3. **Ungated Splash Removal:** Angular bootstrap removes `<app-root>` inner HTML (the splash screen) upon component mounting without awaiting font decoding.

## Solution

### 1. Declare All Used Weights & Preload in Critical Head
Ensure every font weight used above the fold has an explicit `@font-face` and `<link rel="preload">` in `index.html`:

```html
<!-- Critical Font Weight Parity -->
<link rel="preload" as="font" type="font/woff2" href="/fonts/lato-300.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/lato-400.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/lato-700.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/media/primeicons.woff2" crossorigin />

<style>
  @font-face {
    font-family: 'Lato';
    src: url('/fonts/lato-300.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Lato';
    src: url('/fonts/lato-400.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Lato';
    src: url('/fonts/lato-700.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'primeicons';
    src: url('/media/primeicons.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
</style>
```

### 2. Gate View Readiness on `document.fonts.ready`
In the root component or initialization lifecycle, await font readiness before revealing content or dismissing loading states:

```typescript
import { Component, OnInit, signal } from '@angular/core';

@Component({ ... })
export class AppComponent implements OnInit {
  isReady = signal(false);

  async ngOnInit() {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
    this.isReady.set(true);
  }
}
```

## When to Use

- Use when headings or text visibly shift size or weight 100–300ms after the splash screen disappears.
- Use when icon buttons initially render as empty or blank glyphs upon first display.
- Use when auditing Core Web Vitals to achieve 0.00 CLS and zero FOUT.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `font-readiness-splash-gate` conventions outlined above to ensure workspace consistency and prevent regressions.

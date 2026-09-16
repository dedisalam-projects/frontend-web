---
name: primeng-sakai-layout-cls
description: "Use when encountering high Cumulative Layout Shift (CLS) or non-composited margin-left animations in PrimeNG Sakai-ng admin layouts."
tier: local
target-stacks: ["primeng", "sakai", "angular", "scss", "core-web-vitals", "cls"]
metadata:
  origin: auto-extracted
---

# PrimeNG Sakai Admin Layout CLS Elimination

**Extracted:** 2026-09-14
**Context:** Resolving initial Cumulative Layout Shift (CLS > 0.25) and non-composited animation warnings on desktop in Sakai-ng / PrimeNG admin layouts.

## Problem
In the standard Sakai-ng admin template for PrimeNG, Lighthouse and Chrome DevTools performance traces flag a severe layout shift cluster:
- **CLS Score**: ~0.28 (Categorized as "Bad", exceeding the 0.1 threshold)
- **Impacted Element**: `DIV.layout-main-container` (CLS contribution: ~0.228)
- **Trace Warning**: `non-composited animation: margin-left`

### Root Cause
1. `_main.scss` defines:
   ```scss
   .layout-main-container {
       padding: 6rem 2rem 0 2rem;
       transition: margin-left var(--layout-section-transition-duration);
   }
   ```
2. At initial render (before Angular attaches the computed `.layout-static` class via `containerClass()`), `.layout-main-container` defaults to `margin-left: 0`.
3. Once Angular computes the layout state, `_responsive.scss` applies:
   ```scss
   &.layout-static {
       .layout-main-container {
           margin-left: 22rem;
       }
   }
   ```
4. The CSS transition animates `margin-left` from `0` to `22rem` on page load, causing the browser to detect an unexpected horizontal layout shift across the entire content viewport.

## Solution

### 1. Set Default Desktop Margin in `_main.scss`
Directly assign the default desktop sidebar width (`22rem`) to `.layout-main-container` inside a desktop media query:

```scss
/* projects/dashboard/src/assets/layout/_main.scss */
.layout-main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
    padding: 6rem 2rem 0 2rem;
    
    // Prevent 0-to-22rem animated shift on initial load
    @media (min-width: 992px) {
        margin-left: 22rem;
    }
    transition: margin-left var(--layout-section-transition-duration);
}
```

### 2. Lock Aspect Ratios on Table Thumbnails
Ensure data table images in widgets (e.g. `RecentSalesWidget`) specify both `width` and `height` alongside explicit styles:
```html
<img
    src="/demo/images/product/{{ product.image }}"
    alt="{{ product.name }}"
    width="50"
    height="50"
    style="height: 50px; width: 50px; object-fit: cover;"
/>
```

## Results
- **CLS Metric**: Drops from `0.283` (Bad) to `0.055` (Good / Green), achieving an **80% reduction**.
- **Lighthouse Core Web Vitals**: Scores jump from `0.43` to `0.98+` (100% bracket).
- **Zero Breakage**: Toggle transitions when clicking the sidebar hamburger menu remain smooth and functional.

## When to Use
- When auditing performance or Core Web Vitals on Angular + PrimeNG (Sakai-ng) applications.
- When Lighthouse reports `cumulative-layout-shift` failures centered on `.layout-main-container`.
- When Chrome DevTools Performance Trace highlights `non-composited animation: margin-left`.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `primeng-sakai-layout-cls` conventions outlined above to ensure workspace consistency and prevent regressions.

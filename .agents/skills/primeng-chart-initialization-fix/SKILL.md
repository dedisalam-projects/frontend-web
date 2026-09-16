---
name: primeng-chart-initialization-fix
description: "Use when <p-chart> or PrimeNG charts fail to render, or when chart data is loaded asynchronously and results in a blank chart."
metadata:
  origin: auto-extracted
---

# PrimeNG Chart Initialization & Asynchronous Data Fix

**Extracted:** 2026-09-05
**Context:** Applies when upgrading to PrimeNG 18/22 and using `<p-chart>` with Angular Signals or asynchronous data loading.

## Problem
When using PrimeNG's `<p-chart>` component, the chart might completely fail to render (remain blank) due to two distinct issues:
1. **Missing Global Chart.js:** PrimeNG relies on `window.Chart` globally, but modern ESM builds of `chart.js` do not attach to `window` automatically unless the UMD build is bundled.
2. **Asynchronous Initialization Bug:** In PrimeNG, if the `[data]` input is `null` when the component initializes (e.g. waiting for API data or `setTimeout`), `UIChart.initChart()` bails out. When the data signal updates later, `UIChart.reinit()` is called, but it does nothing because it checks `if (this.chart)` which is still `null`. The chart is permanently stuck.

## Solution

### 1. Register Chart.js UMD Globally
In `angular.json`, add the UMD build of `chart.js` to the `scripts` array for the application builder:
```json
"scripts": [
    "node_modules/chart.js/dist/chart.umd.js"
]
```

### 2. Wrap `<p-chart>` in a Conditional Block
Delay the rendering of the `<p-chart>` component until the data is actually available using Angular's `@if` control flow:

**Incorrect:**
```html
<!-- If chartData() starts as null, it will never render even after chartData() updates -->
<p-chart type="bar" [data]="chartData()"></p-chart>
```

**Correct:**
```html
<!-- The component is only instantiated once data is truthy -->
@if (chartData()) {
    <p-chart type="bar" [data]="chartData()"></p-chart>
}
```

## When to Use
- When PrimeNG `<p-chart>` is completely missing from the screen.
- When chart data is initialized using `setTimeout`, API calls, or Angular Signals that start with `null`/`undefined`.
- When encountering "Chart is not defined" errors during PrimeNG initialization.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `primeng-chart-initialization-fix` conventions outlined above to ensure workspace consistency and prevent regressions.

---
name: lighthouse-agentic-browsing-cls
description: "Use when optimizing Lighthouse Agentic Browsing scores, or when Agentic Browsing stalls at 95-99 due to Cumulative Layout Shift (CLS) — eliminate asynchronous widget reflows and dynamic position shifts to reach 100/100"
tier: local
target-stacks: ["*"]
metadata:
  origin: auto-extracted
---

# Lighthouse Agentic Browsing CLS Dependency

**Extracted:** 2026-09-14  
**Context:** Chrome DevTools Lighthouse evaluates the `agentic-browsing` category via 3 active weighted audits: `agent-accessibility-tree` (weight: 1), `llms-txt` (weight: 1), and `cumulative-layout-shift` (weight: 1).

## Problem
Developers often assume `agentic-browsing` only checks AI features (`llms.txt` and semantic markup). However, even with valid `llms.txt` and semantic accessibility trees, the score drops to 95–99 if the page has even a minor layout shift ($\text{CLS} > 0.01$). Autonomous AI agents rely on stable DOM bounding rects to navigate and click targets; unstable layouts are penalized directly under Agentic Browsing.

## Scoring Formula
$$\text{Score} = \frac{\text{A11y Tree (weight 1)} + \text{llms-txt (weight 1)} + \text{CLS Score (weight 1)}}{3}$$
- When $\text{CLS} = 0.000 - 0.001$, CLS Score is $1.0 \implies 3.0 / 3 = \mathbf{100\%}$.
- When $\text{CLS} = 0.055$, CLS Score is $0.98 \implies 2.98 / 3 = \mathbf{99\%}$.
- When $\text{CLS} = 0.073$, CLS Score is $0.95 \implies 2.95 / 3 = \mathbf{98\%}$.

## Root Causes & Solutions

### 1. Asynchronous Widget Height Expansion (e.g. Charts, Tables)
- **Problem**: Mounting widgets (charts, data tables) conditionally with `@if (data)` or after a delay pushes subsequent widgets downward after fetch completes.
- **Fix**: Pre-allocate the container min-height or placeholder space before data arrives:
  ```html
  <div class="card" style="min-height: 480px;">
    <div class="font-semibold text-xl mb-4">Revenue Stream</div>
    @if (chartData()) {
      <p-chart type="bar" [data]="chartData()" class="h-100" />
    } @else {
      <div class="h-100" aria-hidden="true"></div>
    }
  </div>
  ```

### 2. Hydration-Time Positioning Shifts
- **Problem**: Elements designed as fixed overlays (e.g. theme switchers, floating configurators) using dynamic framework bindings (`[ngClass]="{ fixed: float() }"`) render initially in normal document flow, then collapse out of flow once hydrated, shifting all subsequent content.
- **Fix**: Apply `fixed` statically in the template, host class, or style:
  ```html
  <app-floating-configurator class="fixed top-8 right-8 z-50" />
  ```
  And inside the component host or container:
  ```html
  <div [class]="float() ? 'fixed flex gap-4 top-8 right-8 z-50' : 'flex gap-4'">
  ```

## When to Use
- When auditing pages with Lighthouse and `agentic-browsing` score is 95–99 despite a green `llms-txt` audit.
- When stabilizing autonomous agent navigation and automated browser testing workflows.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `lighthouse-agentic-browsing-cls` conventions outlined above to ensure workspace consistency and prevent regressions.

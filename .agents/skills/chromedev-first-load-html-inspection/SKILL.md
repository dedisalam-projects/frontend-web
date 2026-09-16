---
name: chromedev-first-load-html-inspection
description: "Use when detecting scrambled HTML, FOUC, or SSR hydration mismatch on first page load — use Chrome DevTools MCP take_screenshot, take_snapshot, and evaluate_script to capture and inspect raw DOM state before Angular hydration."
tier: local
target-stacks: ["angular", "chrome-devtools", "mcp"]
metadata:
  origin: auto-extracted
---

# Chrome DevTools MCP — First Load HTML Inspection

**Extracted:** 2026-09-14  
**Context:** Debugging Angular SSR pages where the HTML appears scrambled, unstyled, or out-of-order during initial page load before client-side hydration completes.

## Problem

On first load, Angular SSR pages can display:
- **Scrambled/raw HTML** before Angular bootstraps
- **FOUC** (Flash of Unstyled Content) — styles applied late
- **Hydration mismatch** — server-rendered DOM differs from client expectation, causing Angular to re-render with visible flicker

These are hard to catch in DevTools manually because they are transient (< 500ms).

## Solution

Use the `chromedev` MCP tools to programmatically capture the DOM and visual state at different points during page load.

### Step 1 — Identify the Target Page
```json
{ "ServerName": "chromedev", "ToolName": "list_pages", "Arguments": {} }
```

### Step 2 — Navigate and Capture Screenshot Immediately (Before Hydration Settles)
```json
{
  "ServerName": "chromedev",
  "ToolName": "navigate_page",
  "Arguments": { "pageId": 1, "url": "http://localhost:4200/login" }
}
```
Then **immediately** take a screenshot to freeze the first-render state:
```json
{
  "ServerName": "chromedev",
  "ToolName": "take_screenshot",
  "Arguments": { "pageId": 1 }
}
```
> The screenshot captures exactly what the user sees on first render — FOUC or scrambled HTML will be visible here.

### Step 3 — Capture Raw DOM Snapshot (SSR HTML)
```json
{
  "ServerName": "chromedev",
  "ToolName": "take_snapshot",
  "Arguments": { "pageId": 1 }
}
```
Compare the `outerHTML` of key elements to the expected server-rendered structure.

### Step 4 — Inspect Document State via Script
```json
{
  "ServerName": "chromedev",
  "ToolName": "evaluate_script",
  "Arguments": {
    "pageId": 1,
    "script": "document.readyState + ' | ' + document.body.innerHTML.slice(0, 500)"
  }
}
```
- If `readyState` is `"loading"` or `"interactive"`, Angular has not bootstrapped yet.
- Inspect the first 500 chars of `body` to detect unexpected raw SSR content.

### Step 5 — Detect Angular Hydration Marker
```json
{
  "ServerName": "chromedev",
  "ToolName": "evaluate_script",
  "Arguments": {
    "pageId": 1,
    "script": "!!document.querySelector('[ng-version]') + ' | hydrated: ' + !!document.querySelector('[_nghost-ng-c]')"
  }
}
```
- `ng-version` attribute present = Angular has bootstrapped.
- `_nghost-ng-c` present = component views have been hydrated.

### Step 6 — Check Console for Hydration Errors
```json
{
  "ServerName": "chromedev",
  "ToolName": "list_console_messages",
  "Arguments": { "pageId": 1 }
}
```
Look for `NG0500` (hydration mismatch) or `NG0502` errors that indicate server/client DOM divergence.

## When to Use
- HTML looks scrambled or unstyled on first visit
- Page flickers or re-renders visibly after first paint
- Angular console emits `NG05xx` hydration errors
- Lighthouse reports high CLS on first load
- SSR-rendered content differs from client-rendered content

## Key Signals

| Signal | Meaning |
|--------|---------|
| Screenshot shows raw text/tags | FOUC — styles loading too late |
| `readyState: loading` on snapshot | Captured before Angular bootstrap |
| `NG0500` in console | Server DOM != client DOM |
| No `ng-version` attribute | Angular has not mounted yet |
| High CLS in Lighthouse | Layout shift during hydration |

## Related Skills
- `chromedev-network-analysis` — for network request/response inspection
- `angular-ssr-protected-routes` — for flash before auth redirect
- `primeng-sakai-layout-cls` — for CLS caused by Sakai sidebar animation
- `lighthouse-agentic-browsing-cls` — for CLS in Lighthouse scores


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `chromedev-first-load-html-inspection` conventions outlined above to ensure workspace consistency and prevent regressions.

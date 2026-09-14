---
name: chromedev-network-analysis
description: "Use when inspecting HTTP requests, API responses, CORS headers, cookies, or asset downloads via Chrome DevTools MCP — inspect Network tab with list_network_requests and get_network_request."
tier: local
target-stacks: ["chrome-devtools", "mcp"]
metadata:
  origin: auto-extracted
---

# Chrome DevTools MCP Network Tab Analysis

**Extracted:** 2026-09-14
**Context:** Debugging frontend network traffic, backend API Gateway contracts, CORS issues, cookie authentication, or asset bundle transfers using the Chrome DevTools MCP (`chromedev`).

## When to Use
- When debugging missing assets (e.g., 404 images, missing font files).
- When validating API request/response envelopes and HTTP status codes (200 vs 401/403/500).
- When inspecting authentication cookies (`Set-Cookie` or `Cookie` headers) and cross-origin CORS headers.
- When verifying payload sizes and transfer overhead for performance auditing.

## Recommended Workflow

### 1. Identify Pages & Target Page ID
```json
{
  "ServerName": "chromedev",
  "ToolName": "list_pages",
  "Arguments": {}
}
```

### 2. List Network Requests
List requests on the active page, optionally filtering by resource type (`xhr`, `fetch`, `font`, `document`):
```json
{
  "ServerName": "chromedev",
  "ToolName": "list_network_requests",
  "Arguments": {
    "pageId": 1,
    "resourceTypes": ["xhr", "fetch", "font"],
    "pageSize": 50
  }
}
```
*Tip: Set `includePreservedRequests: true` to inspect network traffic across redirects.*

### 3. Inspect Specific Request Headers & Body
Use the `reqid` from the list to view exact headers, status, and payload:
```json
{
  "ServerName": "chromedev",
  "ToolName": "get_network_request",
  "Arguments": {
    "pageId": 1,
    "reqid": 7
  }
}
```

## Key Verification Checks
1. **Status Code**: Confirm 200/201/204 for successful calls, check for unwanted 401/403/404/500.
2. **Security Headers**: Ensure `access-control-allow-origin` matches expected origins without wildcard leaking in credentialed modes.
3. **Cache & Content-Type**: Ensure fonts have `font/woff2`, images have proper MIME types, and scripts have appropriate `cache-control`.

## Network Performance Tracing & Core Web Vitals

When diagnosing page load latency, TTFB, or resource-blocking delays, run a Chrome DevTools performance trace:

### 1. Start Trace with Auto-Reload
```json
{
  "ServerName": "chromedev",
  "ToolName": "performance_start_trace",
  "Arguments": {
    "pageId": 1,
    "reload": true,
    "autoStop": true
  }
}
```

### 2. Analyze Trace Findings
Inspect the generated insights:
- **LCPBreakdown**: Differentiates server response (TTFB) vs client render delay.
- **RenderBlocking**: Identifies critical stylesheets or synchronous scripts delaying first paint.
- **DocumentLatency**: Identifies uncompressed document bytes (missing gzip/brotli).

## Network Optimization Checklist
1. **Font Assets**: Ensure all local fonts (`.woff2`) use `font-display: swap` to prevent Flash of Invisible Text (FOIT).
2. **Cache Headers**: In production (Nginx/CDN), immutable assets (`/media/`, hashed `.js`/`.css`) must serve `Cache-Control: public, max-age=31536000, immutable`.
3. **Crawlable Anchors**: Ensure topbar and landing links include standard `href` attributes alongside router navigation to satisfy SEO crawlability audits.

## Unnecessary Request Pruning (Critical-Path Optimization)

When auditing network requests via `list_network_requests`, actively identify and eliminate non-essential requests from the initial critical path:

### 1. Dynamic Imports for On-Demand Modules
- **Anti-pattern**: Statically importing heavy client libraries (e.g. `socket.io-client`, modal dialogs, rich text editors) that are only executed upon user actions (such as clicking 'Logout' or opening a settings panel).
- **Remedy**: Replace static top-level imports with dynamic runtime imports:
  ```typescript
  async logout(): Promise<void> {
    const { io } = await import('socket.io-client');
    const socket = io(`${environment.socketUrl}/auth`, { ... });
  }
  ```
- **Outcome**: Completely removes the module from the initial critical JavaScript bundle, reducing initial transfer size and eliminating CommonJS optimization warnings.

### 2. Eliminating Stylesheet Round-Trips
- **Anti-pattern**: Dynamically injecting an external font stylesheet (e.g., `/fonts/fonts.css`) via JavaScript `requestIdleCallback`. This forces an extra HTTP network round-trip just to parse `@font-face` rules before discovering `.woff2` font files.
- **Remedy**: Inline local `@font-face` definitions directly into the critical application stylesheet (`styles.scss`). This allows the browser to discover and prefetch font binaries immediately upon HTML/CSS parse.

### 3. Below-the-Fold Lazy Image Loading
- **Anti-pattern**: Omitting `loading="lazy"` on images situated below the initial viewport. The browser requests them eagerly during initial page load, competing for bandwidth with critical CSS and fonts.
- **Remedy**: Keep `fetchpriority="high"` strictly on above-the-fold hero images (LCP candidates), and apply `loading="lazy" decoding="async"` to all below-the-fold images and SVG vectors.



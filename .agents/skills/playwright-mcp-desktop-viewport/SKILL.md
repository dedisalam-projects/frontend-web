---
name: playwright-mcp-desktop-viewport
description: "Use when topbar buttons or navigation links are missing in Playwright MCP snapshots, or when automating desktop UI flows on responsive web apps — configure desktop fullscreen viewport (>= 1024px) to prevent responsive mobile menu collapse."
tier: local
target-stacks: ["playwright", "mcp", "css"]
metadata:
  origin: auto-extracted
---

# Playwright MCP Desktop Viewport & Responsive Visibility

**Extracted:** 2026-09-14  
**Context:** Ensures navigation links, call-to-action (CTA) buttons, and authentication actions (Login/Register/Dashboard) on responsive web applications (Tailwind, PrimeNG, Bootstrap) remain visible and interactable during AI agent browser automation with Playwright MCP.

## Problem

Modern responsive web applications hide topbar navigation links and action buttons on viewports smaller than standard desktop breakpoints (e.g. Tailwind's `lg:` at `1024px` with `hidden lg:flex`):
1. **Default Viewport Trap**: When Playwright MCP launches without an explicit desktop resolution, or on mobile/tablet viewports (< 1024px), navigation elements collapse into a mobile hamburger menu (`button "Menu"`).
2. **Failed Agent Interactions**: AI agents calling `browser_snapshot`, `browser_find`, or `browser_click` fail to detect elements like `link "Login"` or `link "Register"` because they are hidden (`display: none`) in the accessibility tree until the hamburger menu is clicked.
3. **Misdiagnosed Regressions**: Agents incorrectly assume buttons are broken, missing, or omitted from the DOM when the root cause is purely responsive CSS breakpoint behavior.

## Solution

### 1. Configure Default Desktop Viewport in MCP Server
In `.agents/mcp_config.json`, configure `@playwright/mcp` with `--viewport-size 1920x1080`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp",
        "--headless",
        "--viewport-size",
        "1920x1080"
      ]
    }
  }
}
```
- **Result**: All browser sessions spawned by the MCP server initialize at 1080p full desktop resolution, immediately satisfying `lg` (1024px) and `xl` (1280px) breakpoints without requiring runtime resizing.

### 2. Runtime Viewport Resizing via `browser_resize`
When interacting with existing browser contexts or dynamic sessions, explicitly ensure the viewport is set to desktop resolution before attempting to click topbar actions:

```json
{
  "ServerName": "playwright",
  "ToolName": "browser_resize",
  "Arguments": {
    "width": 1920,
    "height": 1080
  }
}
```

### 3. Responsive Menu Interaction Fallback
If intentionally testing on mobile or narrow viewports (< 1024px), interact with the hamburger menu toggle before querying buttons:

```javascript
// On viewports < 1024px, the menu button must be clicked first
await page.getByRole('button', { name: 'Menu' }).click();
// Now the collapsed container is visible
await page.getByRole('link', { name: 'Login' }).click();
```

## When to Use

- When using Playwright MCP to test or audit landing pages, dashboards, or public sites where action buttons disappear under responsive CSS rules.
- When `browser_snapshot` shows `button "Menu"` instead of topbar links like `Home`, `Features`, `Login`, or `Register`.
- When configuring workspace `.agents/mcp_config.json` for frontend projects built with Tailwind CSS, PrimeNG, or Bootstrap.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `playwright-mcp-desktop-viewport` conventions outlined above to ensure workspace consistency and prevent regressions.

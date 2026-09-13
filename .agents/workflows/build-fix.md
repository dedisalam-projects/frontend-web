---
description: "Detect Angular 22 multi-project build errors and incrementally fix compiler, SSR, and type issues with minimal safe changes."
argument-hint: "[project: dashboard | landing | auth | shared-ui]"
---

# Angular Build and Fix

Incrementally fix build, SSR compilation, and TypeScript errors in the `frontend-web` multi-project workspace (`dashboard`, `landing`, `auth`, `shared-ui`).

## Step 1: Detect Target Project & Run Build

Identify which project has build issues or build all projects sequentially:

| Project | Type | Build Command | SSR Output |
|---|---|---|---|
| **`dashboard`** | Application | `ng build dashboard` | `dist/dashboard/server/server.mjs` (:4000) |
| **`landing`** | Application | `ng build landing` | `dist/landing/server/server.mjs` (:4001) |
| **`auth`** | Application | `ng build auth` | `dist/auth/server/server.mjs` (:4002) |
| **`shared-ui`** | Library | `ng build shared-ui` | `dist/shared-ui` |
| **All Projects** | Full Workspace | `npm run build` | Builds all 4 projects |
| **TypeScript Only**| Type Check | `npx tsc --noEmit` | Validates type contracts |

```bash
# Target specific project build:
npx ng build dashboard

# Build library first if shared types/components changed:
npx ng build shared-ui && npx ng build dashboard
```

## Step 2: Parse and Group Errors

1. Capture compiler errors from Angular CLI (`@angular-devkit/build-angular:application`).
2. Group errors:
   - **Type & Contract Errors**: Missing imports, mismatched interfaces, unexported members in `shared-ui`.
   - **SSR Prerender Errors**: `window is not defined`, `document is not defined`, `localStorage` accessed directly during prerendering.
   - **PrimeNG / PrimeUI Errors**: Missing module/component in `imports: []`, invalid theme preset import, missing license configuration.
   - **Tailwind v4 / PostCSS Errors**: Invalid `@import "tailwindcss";` or missing `@theme` syntax.

## Step 3: Common Angular 22 Resolution Patterns

### 1. SSR `window` or `document` Not Defined
Wrap browser-only APIs using `isPlatformBrowser` and `PLATFORM_ID`:
```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

const platformId = inject(PLATFORM_ID);
if (isPlatformBrowser(platformId)) {
  const token = localStorage.getItem('token');
}
```

### 2. Chart.js Global Missing in SSR
Ensure `chart.js/dist/chart.umd.js` is registered in `angular.json` under `scripts` and `<p-chart>` is rendered conditionally with `@if (chartData())`.

### 3. Shared Library Import Errors
Always import shared UI elements from the workspace path mapping defined in `tsconfig.json` (e.g. `@sakai/shared-ui` or relative `projects/shared-ui/src/public-api`). Rebuild `shared-ui` before building consumer apps.

## Step 4: Fix Loop (One Error at a Time)

1. **Inspect Context**: Read 10-15 lines around the error.
2. **Diagnose**: Determine if error is client-side TypeScript, SSR prerendering, or template binding.
3. **Fix Minimally**: Make the smallest surgical change necessary.
4. **Re-run Build**: Run `ng build <project>` to verify the error is resolved.
5. **Move to Next**: Continue until build exits with code 0.

## Step 5: Guardrails

Stop and ask the user if:
- A fix introduces more errors than it resolves.
- The same error persists after 3 attempts.
- Changes require altering the micro-frontend port contracts (:4000, :4001, :4002) or shared API types.

---
name: angular-workspace-ssr-shared-lib
description: "Use when fixing SSR (Server-Side Rendering) prerender errors like 'window is not defined' or 'document is not defined' in an Angular CLI Workspace with shared libraries."
metadata:
  origin: auto-extracted
---

# Angular Workspace SSR Shared Library Workflow

**Extracted:** 2026-09-06
**Context:** Applies when working in an Angular CLI Workspace (monorepo) where standalone applications (e.g., `dashboard`, `landing`) consume a shared library (e.g., `shared-ui`) via `tsconfig.json` path mappings pointing to the `dist/` directory, and the apps have SSR (Server-Side Rendering) enabled.

## Problem
During the SSR prerendering phase (`ng build <app>`), the build may crash with errors like `ReferenceError: window is not defined` or `document is not defined`. 
If the code causing the error resides inside a shared library (`projects/shared-ui/`), simply editing the source code of the library (e.g., adding `isPlatformBrowser` checks) **will not fix the error** when you rebuild the application. This is because the application consumes the compiled version of the library from the `dist/` folder, not the raw TypeScript source files.

## Solution
1. **Fix the code:** Guard all DOM access (`window`, `document`, `getComputedStyle`, event listeners) inside the library using `isPlatformBrowser`:
   ```typescript
   import { PLATFORM_ID, inject } from '@angular/core';
   import { isPlatformBrowser } from '@angular/common';

   platformId = inject(PLATFORM_ID);

   someMethod() {
     if (isPlatformBrowser(this.platformId)) {
       // Safe to access window or document here
       const w = window.innerWidth;
     }
   }
   ```
2. **Rebuild the library FIRST:** You MUST build the shared library before building the consuming application.
   ```bash
   ng build shared-ui
   ```
3. **Rebuild the application:** Once the library is updated in the `dist/` folder, build the application to verify the prerender fix.
   ```bash
   ng build dashboard
   ```

## When to Use
- When debugging `ReferenceError: window is not defined` during an Angular build.
- When you make changes to a shared library in a monorepo but the changes don't seem to take effect in the consuming application.
- When working on SSR (Server-Side Rendering) setup for multiple Angular applications sharing UI components.

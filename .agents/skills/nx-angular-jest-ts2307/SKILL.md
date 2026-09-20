---
name: nx-angular-jest-ts2307
description: "Use when fixing TS2307 (Cannot find module '@angular/core/testing') in Jest tests within an Angular Nx workspace."
metadata:
  origin: auto-extracted
---

# Fix Angular Core Testing TS2307 in Nx Jest

**Extracted:** 2026-09-05
**Context:** When running Jest tests via `nx test` in an Angular library or application, TypeScript fails to resolve `@angular/core/testing` or `zone.js`.

## Problem
You encounter `TS2307: Cannot find module '@angular/core/testing'` when testing an Angular standalone component in an Nx workspace.
This occurs because Nx's generated `tsconfig.spec.json` often defaults to `"moduleResolution": "node10"` and `"module": "commonjs"`. Angular 22 uses package `exports` which are incompatible with `node10` module resolution, causing Jest's `ts-jest` to fail at compile-time.

## Solution
Remove `moduleResolution` and `module` from the library's `tsconfig.spec.json` so it inherits the modern module resolution settings (e.g., `bundler` or `node16`) from the root `tsconfig.base.json`.

```json
// tsconfig.spec.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    // REMOVE: "module": "commonjs"
    // REMOVE: "moduleResolution": "node10"
    "types": [
      "jest",
      "node"
    ]
  },
  // ...
}
```

## When to Use
- Trigger: Running `nx test` or `jest` on an Angular project fails with module resolution errors for `@angular/core/testing`.
- Trigger: Seeing `TS151001` or `TS2307` for `@angular/*` packages in test environments.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `nx-angular-jest-ts2307` conventions outlined above to ensure workspace consistency and prevent regressions.

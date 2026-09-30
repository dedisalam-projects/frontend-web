---
name: angular-ssr-testbed-mocking
description: "Use when writing unit tests for Angular SSR services or functional guards, when encountering 'Cannot read properties of null (reading querySelectorAll)' during TestBed teardown, or when resolving PLATFORM_ID token mismatch between @angular/core and @angular/common."
tier: local
target-stacks: ["angular", "typescript", "vitest", "jest"]
metadata:
  origin: auto-extracted
---

# Angular SSR TestBed Mocking & 100% Branch Coverage Patterns

**Extracted:** 2026-09-28  
**Context:** Applied when writing unit and branch-exhaustive tests for Angular 17+ / 19+ / 21+ applications utilizing Server-Side Rendering (SSR), standalone functional guards (`CanActivateFn`), and browser/server platform bifurcations.

## Problem

When unit-testing Angular applications that interact with platform abstractions (`PLATFORM_ID`, `DOCUMENT`, `localStorage`, cookies):

1. **`PLATFORM_ID` Token Collision**:
   Angular packages export `PLATFORM_ID` from both `@angular/core` and `@angular/common`. However, in modern Angular, dependency injection token equality requires importing `PLATFORM_ID` strictly from `@angular/core`. Importing from `@angular/common` yields a distinct object token that fails to shadow the root `PlatformLocation` / `PLATFORM_ID` in child injectors (`Injector.create`), leaving the service in browser mode despite `{ provide: PLATFORM_ID, useValue: 'server' }`.

2. **TestBed DOM Teardown Crashes when Mocking `DOCUMENT`**:
   Configuring `{ provide: DOCUMENT, useValue: null }` or passing an incomplete document mock into `TestBed.configureTestingModule` crashes the test suite during after-each teardown:
   ```text
   TypeError: Cannot read properties of null (reading 'querySelectorAll')
       at DOMTestComponentRenderer.removeAllRootElements
   ```
   Angular's internal test renderer queries the root document during cleanup. If `DOCUMENT` in the root testbed is `null`, teardown fails unconditionally.

3. **Incomplete V8 Branch Coverage on Functional Guards**:
   Standalone guards (`CanActivateFn`) relying on `inject(PLATFORM_ID)` and `inject(DOCUMENT, { optional: true })` often produce hidden uncovered branches (e.g. `if (document)` false branch, `document.defaultView` null branch, or JWT expired/missing token evaluation) when tested solely via router harness.

## Solution

Apply the **Proxy-Preserved Root & Child Injector Shadowing** pattern:

### 1. Enforce Strict `@angular/core` Import for `PLATFORM_ID`

Always import `PLATFORM_ID` from `@angular/core`, not `@angular/common`:

```typescript
// Correct
import { PLATFORM_ID } from '@angular/core';

// Incorrect - resolves to incompatible token in child injectors
import { PLATFORM_ID } from '@angular/common';
```

### 2. Mock Browser Properties with `Proxy(document, ...)` in Root TestBed

Preserve underlying DOM query functions (`querySelectorAll`, `createElement`) while intercepting properties like `location` or `defaultView`:

```typescript
let mockLoc = { href: '' };

const mockDoc = new Proxy(document, {
  get(target: any, prop: string | symbol) {
    if (prop === 'location') return mockLoc;
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
  set(target: any, prop: string | symbol, value: any) {
    if (prop === 'location') {
      mockLoc.href = value;
      return true;
    }
    target[prop] = value;
    return true;
  },
});

TestBed.configureTestingModule({
  providers: [
    { provide: DOCUMENT, useValue: mockDoc },
    { provide: PLATFORM_ID, useValue: 'browser' },
  ],
});
```

### 3. Use `Injector.create` for Testing `DOCUMENT = null` and SSR Paths

Never provide `DOCUMENT: null` in the root `TestBed`. Instead, spin up a transient child injector within the test case:

```typescript
it('should handle SSR or absent document without crashing TestBed teardown', () => {
  const isolatedInjector = Injector.create({
    providers: [
      { provide: MyService, useClass: MyService },
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: DOCUMENT, useValue: null },
    ],
    parent: TestBed.inject(Injector),
  });

  const service = isolatedInjector.get(MyService);
  expect(service.isAuthenticated()).toBe(true);
});
```

### 4. Test Functional Guards (`CanActivateFn`) with `runInInjectionContext`

Execute functional guards directly without router overhead while exercising 100% of optional and platform branches:

```typescript
import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, Injector } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('should cover document = null branch for valid url token', () => {
    const route: any = { queryParams: { token: 'valid.jwt.token' } };
    const state: any = { url: '/protected' };

    const docNullInjector = Injector.create({
      providers: [
        { provide: DOCUMENT, useValue: null },
      ],
      parent: TestBed.inject(Injector),
    });

    const result = runInInjectionContext(docNullInjector, () => authGuard(route, state));
    expect(result).toBe(true);
  });
});
```

## When to Use

- Writing unit tests for Angular 17+ / 19+ / 21+ services or guards that branch on `isPlatformBrowser(platformId)`.
- Overriding browser globals (`document.location`, `document.cookie`) without polluting other tests or triggering `removeAllRootElements` errors.
- Targeting 100% statement, branch, function, and line coverage under Vitest or Jest.

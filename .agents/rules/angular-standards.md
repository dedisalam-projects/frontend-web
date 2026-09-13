---
paths:
  - "projects/**/*.ts"
  - "projects/**/*.html"
---

# Angular Architecture & Engineering Standards

## 1. Modern Architecture & Component Design
- **Standalone by Default**: All components, directives, and pipes must be standalone (`standalone: true` or default in Angular 19+).
- **Change Detection**: Always use `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Dependency Injection**: Prefer functional `inject(ServiceName)` over constructor parameter injection.
- **Signals for State**:
  - Use `signal()`, `computed()`, and `effect()` for local and shared state.
  - Expose signals as readonly via `mySignal.asReadonly()`.
  - Use `toSignal()` / `toObservable()` for RxJS interoperability. Avoid manual `.subscribe()` whenever possible.

## 2. SSR & Hydration Safety
- **Platform Guards**: Protect all DOM, browser, and `window`/`document`/`localStorage` accesses with `isPlatformBrowser(this.platformId)` or inject `DOCUMENT`.
- **Zero DOM in Constructor**: Never read window dimensions, element offsets, or storage during component initialization.
- **Prerendering**: Ensure routes handle server prerendering without throwing `ReferenceError: window is not defined`.

## 3. Security Standards
- **Template Sanitization**: Rely on Angular's built-in contextual sanitization.
- **DomSanitizer Policy**: Strictly limit `DomSanitizer.bypassSecurityTrust*`. Any usage requires documented justification and automated lint overrides.
- **HTTP Interceptors**: Centralize authorization headers and token refreshes via functional HTTP interceptors (`withInterceptors([authInterceptor])`).

## 4. Testing & Verification
- **Component Harnesses**: Use Angular CDK component harnesses where available for robust UI interaction tests.
- **Test Isolation**: Provide mock services via `TestBed.configureTestingModule({ providers: [...] })`.
- **Signal Testing**: Ensure signals and computed values update correctly; use `TestBed.flushEffects()` or `fixture.detectChanges()` when verifying reactive updates.

---
name: software-testing-matrix
description: "Use when designing, implementing, or evaluating fullstack testing strategies, testing parameters, thresholds, or tool selection — comprehensive testing matrix covering unit, mutation, integration, E2E, SSR, performance, accessibility, and security standards."
tier: local
target-stacks: ["angular", "nestjs", "typescript", "playwright", "jest"]
metadata:
  origin: auto-extracted
---

# Software Testing Matrix & Quality Parameters

**Context:** Fullstack enterprise applications (Angular Micro-frontends + NestJS Microservices).  
This guide defines mandatory testing layers, quantitative parameter thresholds, and recommended tooling to guarantee system reliability, performance, and security.

---

## 1. Testing Pyramid & Layer Overview

```
                  ┌──────────────────────┐
                  │   E2E & User Flow    │ (Playwright)
                  ├──────────────────────┤
                  │ Performance, a11y,   │ (Lighthouse, Axe-core,
                  │  Security & Soak     │  Artillery, Toxiproxy)
               ┌──┴──────────────────────┴──┐
               │    Integration & Contract  │ (Supertest, Pact, Testcontainers)
            ┌──┴────────────────────────────┴──┐
            │   Property-Based & Mutation      │ (Fast-Check, StrykerJS)
         ┌──┴──────────────────────────────────┴──┐
         │       Unit & Signal/Component         │ (Karma/Jasmine, Vitest, Jest)
         └────────────────────────────────────────┘
```

---

## 2. Layer Parameters, Thresholds & Tooling

### Layer 1: Unit & Component Testing
- **Core Parameters & Thresholds:**
  - **Statement Coverage:** $\ge 80\%$ (target $100\%$ for authentication and financial services).
  - **Branch Coverage:** $\ge 80\%$ to $100\%$ (covers all `if`, `else`, `switch`, ternary expressions, and template control flow `@if`, `@switch`).
  - **Function & Line Coverage:** $\ge 80\%$.
  - **Boundary Values:** Zero uncaught exceptions on `null`, `undefined`, empty strings, negative integers, and extreme values.
  - **Signal Reactivity:** Angular signals (`signal`, `computed`, `effect`) correctly propagate changes under `OnPush` strategy.
  - **Component Isolation:** 0 external network requests during execution (enforce `provideHttpClientTesting()` and mock harnesses).
- **Tools:**
  - **Frontend:** Karma + Jasmine (`ng test`), Vitest (`npx vitest run --coverage`), `@angular/core/testing`.
  - **Backend:** Jest (`@nestjs/testing`), mock providers.

### Layer 2: Mutation Testing (Test Quality Gate)
- **Core Parameters & Thresholds:**
  - **Mutant Kill Rate (Mutation Score):** $\ge 80\%$ (target $100\%$ in shared utility libraries).
  - **Mutation Operators Tested:** Arithmetic replacements (`+` $\rightarrow$ `-`), equality mutations (`===` $\rightarrow$ `!==`), conditional boundary mutations (`<` $\rightarrow$ `<=`), boolean inversions (`true` $\rightarrow$ `false`), and string literal mutations.
- **Tools:**
  - **Runner:** StrykerJS (`@stryker-mutator/core`, `@stryker-mutator/jest-runner`).

### Layer 3: Property-Based Testing (PBT / Fuzzing)
- **Core Parameters & Thresholds:**
  - **Sample Runs:** $100$ to $1,000$ iterations per test case.
  - **Counterexample Shrinking:** Automatic simplification of failure-inducing payloads to minimal reproducible cases.
  - **Invariants:** Roundtrip serialization safety (`deserialize(serialize(x)) === x`) and mathematical properties.
- **Tools:**
  - **Runner:** `fast-check`.

### Layer 4: Integration & Contract Testing
- **Core Parameters & Thresholds:**
  - **HTTP Status Validation:** Explicit verification of 200, 201, 400, 401, 403, 404, and 500 status codes.
  - **Envelope Schema Consistency:** Unified JSON payload contract (`{ data, meta, error, statusCode }`).
  - **CORS & Credentials:** `access-control-allow-credentials: true` validation across micro-frontends.
  - **Auth Interceptors:** Automatic attachment of `Authorization: Bearer <token>` and token refresh flow upon HTTP 401.
- **Tools:**
  - **Contract Testing:** Pact (`@pact-foundation/pact`).
  - **Live API Testing:** Supertest, Testcontainers (ephemeral Docker containers for databases/Redis/RabbitMQ).

### Layer 5: End-to-End (E2E) & User Journey Testing
- **Core Parameters & Thresholds:**
  - **Critical User Flows:** 0 failures across Login $\rightarrow$ Auth Handoff $\rightarrow$ Dashboard Navigation $\rightarrow$ CRUD Mutations $\rightarrow$ Logout.
  - **Cross-Port Auth Handoff:** Shared token state preserved across distinct local micro-frontend ports (e.g., Auth `4002` to Dashboard `4000`).
  - **Multi-Viewport Matrix:**
    - Desktop: $1920 \times 1080$ and $1366 \times 768$
    - Tablet: $768 \times 1024$
    - Mobile: $375 \times 667$ and $390 \times 844$
  - **Form Validation & Modals:** Accessible dialog lifecycle, focus trapping, and real-time field error messaging.
- **Tools:**
  - **Runner:** Playwright (`@playwright/test`).

### Layer 6: SSR, Hydration & Prerender Testing
- **Core Parameters & Thresholds:**
  - **Zero Server Exceptions:** 0 unhandled `ReferenceError: window is not defined` or `document is not defined` during Node.js server execution.
  - **Platform Guarding:** 100% of browser/DOM/storage accesses protected with `isPlatformBrowser(platformId)`.
  - **Hydration Mismatch:** 0 hydration divergence warnings in the browser console.
  - **Static Prerender Build:** 100% clean exit on `ng build --configuration production/development`.
- **Tools:**
  - **Runner:** Angular CLI SSR builder (`@angular/ssr`), `@angular/platform-server`.

### Layer 7: Performance & Core Web Vitals (CWV)
- **Core Parameters & Thresholds (Google 'Good' Baseline):**
  - **LCP (Largest Contentful Paint):** $< 2.5$ seconds.
  - **INP (Interaction to Next Paint):** $< 200$ milliseconds.
  - **CLS (Cumulative Layout Shift):** $< 0.1$.
  - **FCP (First Contentful Paint):** $< 1.5$ seconds.
  - **TTFB (Time to First Byte):** $< 800$ milliseconds.
  - **Bundle Size Budget:** Initial bundle $< 500$ KB gzipped; single lazy chunks $< 1$ MB.
- **Tools:**
  - **Auditors:** Lighthouse CI (`lhci`), Chrome DevTools Performance Profiler, WebPageTest.

### Layer 8: Accessibility (a11y)
- **Core Parameters & Thresholds:**
  - **WCAG 2.2 Level AA Compliance:** 0 violations.
  - **Color Contrast:** Minimum **4.5:1** for regular body text; minimum **3:1** for large text and interactive UI controls.
  - **Keyboard Navigation:** 100% interactive elements accessible via `Tab`, `Enter`, `Space`, `Esc` with visible `:focus-visible` outlines.
  - **ARIA & Semantics:** Valid semantic hierarchy (`h1` $\rightarrow$ `h2`), `alt` attributes on images, explicit `aria-label` on icon buttons.
- **Tools:**
  - **Auditors:** Axe-core (`@axe-core/playwright`), Lighthouse Accessibility.

### Layer 9: Security, Penetration & Vulnerability Testing
- **Core Parameters & Thresholds:**
  - **Dependency CVEs:** 0 Critical and 0 High vulnerabilities.
  - **XSS & Injection:** Sanitization of all dynamic inputs, strict Content Security Policy (CSP), zero raw `innerHTML`.
  - **RBAC & Authorization:** Complete prevention of privilege escalation via ID/role spoofing.
  - **Secret Hygiene:** 0 private keys, secrets, or credentials committed to repository history.
- **Tools:**
  - **Scanners:** `npm audit`, Snyk, SonarQube, AgentShield.

### Layer 10: Resilience, Load & Soak Testing
- **Core Parameters & Thresholds:**
  - **Throughput & Latency:** P95 latency $< 200$ms under target concurrent request volume.
  - **Memory Leak Delta (Soak Stability):** Heap memory growth $< 30$ MB across 100+ consecutive connect/disconnect cycles.
  - **Listener Accumulation:** 0 residual event listeners following connection teardown.
- **Tools:**
  - **Load Testing:** Artillery, k6.
  - **Chaos Simulation:** Toxiproxy (packet drop, jitter, latency simulation).

---

## 3. Tool Matrix Summary

| Layer | Primary Tools | Commands / Execution |
|---|---|---|
| **Unit (Frontend)** | Karma, Jasmine, Vitest | `npx ng test <project> --no-watch --code-coverage` |
| **Unit (Backend)** | Jest, `@nestjs/testing` | `npx jest --coverage` |
| **Mutation** | StrykerJS | `npx stryker run` |
| **Property-Based** | Fast-Check | Integrated within Jest/Vitest specs |
| **Contract** | Pact | `npm run test:contract` |
| **Integration** | Supertest, Testcontainers | `npx jest --config jest-e2e.json` |
| **E2E** | Playwright | `npx playwright test` |
| **SSR / Prerender** | Angular SSR Builder | `npx ng build <project> --configuration development` |
| **Performance** | Lighthouse CI | `lhci autorun` |
| **Accessibility** | Axe-core | Integrated in Playwright specs (`axe.analyze()`) |
| **Security** | `npm audit`, Snyk | `npm audit --audit-level=high` |
| **Load & Chaos** | Artillery, Toxiproxy | `npx artillery run load-test.yml` |
| **Gatekeeper** | Husky | `.husky/pre-push` gate |

---

## 4. When to Use
- When planning a new micro-frontend or microservice feature.
- When configuring CI/CD verification pipelines and pre-push quality gates.
- When evaluating test coverage or diagnosing flaky tests.
- When preparing an application for production deployment or security audits.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `software-testing-matrix` conventions outlined above to ensure workspace consistency and prevent regressions.

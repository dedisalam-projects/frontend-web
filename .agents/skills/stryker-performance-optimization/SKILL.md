---
name: stryker-performance-optimization
description: "Use when Stryker mutation testing is running extremely slow or timing out — configure testing parallelism to utilize multiple CPU cores."
tier: local
target-stacks: ["stryker", "vitest", "jest"]
metadata:
  origin: auto-extracted
---

# Stryker Performance Optimization (Parallelism)

**Extracted:** 2026-09-18
**Context:** During frontend mutation testing, Stryker runs were bottlenecked and extremely slow because `concurrency` was artificially limited to `1` in the configuration files, unlike the backend which was optimized with `concurrency: 6`.

## Problem
Mutation testing involves running the entire test suite hundreds or thousands of times. If `concurrency` is omitted, misconfigured, or set to `1` in `stryker.*.config.json`, the execution is strictly sequential, leading to massive CI/CD delays and degraded developer experience.

## Solution
Always explicitly configure Stryker to use optimal parallelism matching the host's CPU threads. For modern development environments and CI runners, a concurrency of `4` to `6` (or `concurrency: CPU_CORES / 2`) provides the best balance between speed and memory usage.

### Executable Code Block

Update your `stryker.config.json` (or equivalent `.js`/`.mjs` config) to explicitly declare the `concurrency` parameter:

```json
{
    "$schema": "https://stryker-mutator.io/schemas/stryker-schema.json",
    "testRunner": "vitest",
    "mutate": [
        "src/**/*.ts",
        "!**/*.spec.ts"
    ],
    // MUST BE CONFIGURED: Do not leave at 1. Match backend parallelism.
    "concurrency": 6,
    "timeoutMS": 60000
}
```

## When to Use
- When creating or reviewing a new `stryker.config.json` file.
- When the user complains about mutation tests taking too long.
- When auditing testing performance across micro-frontends and microservices to ensure parity.

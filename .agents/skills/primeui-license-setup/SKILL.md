---
name: primeui-license-setup
description: "Use when setting up PrimeNG v22+ (PrimeUI) or Sakai-ng, or when encountering missing license key errors — How to configure the PrimeUI license key in an Angular application."
metadata:
  origin: auto-extracted
---

# PrimeUI License Key Configuration

**Extracted:** 2026-09-05
**Context:** When initializing or updating a PrimeNG (v22+) or Sakai-ng project that requires a PrimeUI Community or Commercial license key.

## Problem
Starting with PrimeNG version 22+ (PrimeUI), the library transitioned from MIT to a commercial licensing model. It now requires a valid license key (Community or Commercial) for use. Without this, the application may show license validation warnings or fail to initialize correctly.

## Solution
The license key is configured within the application's bootstrap process. In modern standalone Angular applications, this is done inside `src/app.config.ts` (or `main.ts`) by passing the `license` property to the `providePrimeNG` function object.

```typescript
import { ApplicationConfig } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
    providers: [
        // other providers...
        providePrimeNG({ 
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            // Insert the PrimeUI JWT license key here
            license: 'YOUR_JWT_LICENSE_KEY_HERE'
        })
    ]
};
```

## When to Use
- When configuring a new PrimeNG or Sakai-ng project.
- When migrating to PrimeNG version 22 or later.
- When you see a "PrimeUI license missing" or similar console warning.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `primeui-license-setup` conventions outlined above to ensure workspace consistency and prevent regressions.

---
name: angular-pm2-ssr
description: "Use when deploying Angular 17+ SSR apps with PM2, or when encountering 400 Bad Request Host header errors in production — wrap the ES module server using dynamic imports to bypass isMainModule checks and inject NG_ALLOWED_HOSTS."
metadata:
  origin: auto-extracted
---

# Deploying Angular 17+ SSR via PM2 with Custom Allowed Hosts

**Extracted:** 2026-09-06
**Context:** When deploying Angular 17+ Server-Side Rendered (SSR) applications using PM2 in cluster or fork mode, especially when strict SSRF `Host` header validations block legitimate requests.

## Problem
Angular 17+ SSR (via `@angular/ssr/node`) introduces strict Server-Side Request Forgery (SSRF) protection. It validates the incoming HTTP `Host` header against `process.env.NG_ALLOWED_HOSTS`. 
When running via PM2, two problems occur:
1. **Host Header Mismatch:** `localhost` is allowed by default, but requests to `localhost:4000` will fail with a `400 Bad Request` unless explicitly whitelisted with their port.
2. **isMainModule Failure:** `server.mjs` checks `isMainModule(import.meta.url)` to start the Express server. Under PM2, this check often fails because PM2 wraps the execution, preventing the server from listening.
3. **Hoisting:** Setting `process.env.NG_ALLOWED_HOSTS` inside the `server.mjs` entry point or a simple wrapper before a static `import` fails because static imports are hoisted and executed before the environment variable is assigned.

## Solution
Create a standalone `.mjs` wrapper script for PM2 that explicitly sets the allowed hosts and uses a **top-level await dynamic import** to load the compiled server request handler, then binds it to a manually instantiated Express app.

**1. Create the wrapper script (e.g., `pm2-dashboard.mjs`):**

```javascript
// Set the allowed hosts WITH ports AND production domains BEFORE importing the Angular server engine
const ALLOWED_HOSTS = [
  'localhost',
  'localhost:4000',
  '127.0.0.1',
  '127.0.0.1:4000',
  'dedisalam.my.id',
  'auth.dedisalam.my.id',
  'dash.dedisalam.my.id'
].join(',');

process.env.NG_ALLOWED_HOSTS = ALLOWED_HOSTS;

import express from 'express';

// Dynamically import to ensure process.env is set BEFORE module evaluation
const { reqHandler } = await import('./dist/dashboard/server/server.mjs');

const app = express();

// Use the exported request handler directly
app.use(reqHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Dashboard server listening on port ${port}`);
});
```

**2. Update `ecosystem.config.js` to point to the wrapper:**

```javascript
module.exports = {
  apps: [
    {
      name: 'dashboard',
      script: 'pm2-dashboard.mjs',
      env: {
        PORT: 4000
      }
    }
  ]
};
```

## When to Use
- When PM2 deployment of an Angular 17+ SSR app exits silently without starting the HTTP server.
- When you receive `ERROR: Bad Request ("http://..."). Header "host" with value "..." is not allowed.`
- When you need to securely inject environment variables into an Angular SSR Node process before the engine initializes.

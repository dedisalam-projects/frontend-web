---
name: angular-api-gateway-integration
description: "Use when connecting Angular micro-frontends to the backend API Gateway, or when implementing environment configs, HTTP interceptors, withCredentials, and response envelope unwrapping — standardized frontend integration contract with the local NestJS API Gateway."
tier: local
target-stacks: ["angular", "typescript"]
metadata:
  origin: auto-extracted
---

# Angular API Gateway Integration

**Extracted:** 2026-09-13  
**Context:** Standardized frontend integration pattern for Angular 21/22 micro-frontend workspaces connecting to the local NestJS API Gateway.

## Problem
In a multi-application Angular workspace (`landing`, `dashboard`, `auth`), micro-frontends running on distinct ports (`:4000`, `:4001`, `:4002`) often suffer from:
1. Hardcoded API URLs (`http://localhost:3000/...`) scattered across components and services.
2. Inconsistent handling of the standard backend response envelope (`{ statusCode, message, data, meta }`).
3. Dropped authentication cookies and session headers due to missing `{ withCredentials: true }` in cross-origin HTTP requests.
4. Hardcoded Socket.IO notification namespaces without centralized endpoint configuration.
5. Inadvertent connections to remote staging/production environments instead of the local Docker Compose development stack.

## Solution

### 1. Multi-Project Environment Configuration
Never hardcode gateway URLs in services or components. Define `src/environments/environment.ts` and `src/environments/environment.development.ts` in each project:

```typescript
// projects/<app>/src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: '/api/v1',
  socketUrl: '',
};

// projects/<app>/src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  socketUrl: 'http://localhost:3000',
};
```

### 2. Standard API Response Envelope & Unwrapping Pattern
The Gateway standardizes all REST responses into a structured envelope:

```typescript
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}
```

Implement defensive unwrapping in services or an HTTP interceptor to handle both wrapped envelopes and raw payloads:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  async getUsers(): Promise<User[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<User[]> | User[]>(this.apiUrl, {
        withCredentials: true // Mandatory for cross-port cookie authentication
      })
    );

    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as ApiResponse<User[]>).data)) {
      return (res as ApiResponse<User[]>).data;
    }
    return [];
  }
}
```

### 3. Cross-Origin Credentials (`withCredentials: true`)
Because micro-frontends run on different ports (`:4000`, `:4001`, `:4002`), browser requests to the Gateway (`:3000`) are cross-origin.
- The Gateway provides `Access-Control-Allow-Credentials: true`.
- Every HTTP request carrying JWT cookies or refresh tokens must include `{ withCredentials: true }`.
- Socket.IO handshakes should supply the auth token in `auth.token`:

```typescript
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

const socket: Socket = io(`${environment.socketUrl}/notifications`, {
  withCredentials: true,
  auth: { token: localStorage.getItem('accessToken') }
});
```

### 4. Correlation ID & Tracing Headers
The Gateway attaches `X-Correlation-ID` and rate-limit headers (`X-RateLimit-Remaining`). Include these in error logging or observability interceptors for end-to-end trace correlation.

### 5. Local Infrastructure Verification Protocol
Before developing or testing API integrations, verify that the local backend stack is healthy:

```bash
# Verify all backend containers in infrastructure/docker-compose.dev.yml
curl.exe -s http://localhost:3000/api/v1/health
```

> [!IMPORTANT]
> **Strict Local-Only Development Policy:** All development occurs against local Docker Compose (`docker-compose.dev.yml`). Remote servers (ThinkCentre `172.16.254.2`) are strictly reserved for Staging and Production CI pipelines.

## When to Use
- Connecting an Angular component or service to backend endpoints via the API Gateway.
- Configuring Angular environments for multi-app micro-frontends (`auth`, `dashboard`, `landing`).
- Implementing `HttpClient` calls requiring session cookies or cross-port JWT sharing.
- Consuming backend REST endpoints that wrap payloads in `{ statusCode, message, data, meta }`.
- Establishing real-time Socket.IO connections with the notification gateway.

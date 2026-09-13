# Frontend Web — Micro-Frontend Architecture (`Sakai19`)

Modern enterprise web application built on **Angular 21/22**, **PrimeNG 22**, and **Tailwind CSS 4**. The repository is architected as an isolated multi-project monorepo containing three distinct micro-frontends and a shared component library.

---

## 🏛️ Repository Structure & Sub-Projects

| Sub-Project | Path | Local Port | Production Domain | Internal Container | Port |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing** | `projects/landing` | `http://localhost:4001` | `https://dedisalam.my.id` | `frontend-landing` | `8080` |
| **Auth** | `projects/auth` | `http://localhost:4002` | `https://auth.dedisalam.my.id` | `frontend-auth` | `8080` |
| **Dashboard** | `projects/dashboard` | `http://localhost:4000` | `https://dash.dedisalam.my.id` | `frontend-dashboard` | `8080` |
| **Shared UI** | `projects/shared-ui` | N/A (Library) | Bundled into applications | — | — |

---

## 🔌 Backend Integration Guide (DevOps Handover)

The frontend applications consume a local NestJS microservice backend managed via `infrastructure/docker-compose.dev.yml`.

### 1. Active Service Topology & Local Endpoints

| Service | Host Port | Base URL / Connection String | Description |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `3000` | `http://localhost:3000` | Primary HTTP REST & WebSocket entrypoint |
| **User Service** | Internal | Routed via Gateway (`/api/v1/users`, `/api/v1/auth`) | Authentication, RBAC, profile management |
| **Notification Service** | Internal | Routed via Gateway (`/api/v1/notifications`, Socket.IO) | Real-time notifications and system alerts |
| **MongoDB** | `27017` | `mongodb://root:rootpassword@localhost:27017/user_db?authSource=admin` | Local database (Compass inspection) |
| **Redis** | `6379` | `redis://:redispassword@localhost:6379` | Token blacklist, session cache |
| **RabbitMQ UI** | `15672` | `http://localhost:15672` (`guest` / `guest`) | Async message broker management console |

### 2. API Gateway Integration Contract

- **Route Prefix**: All REST API endpoints must include the **`/api/v1`** prefix.
  - Healthcheck: `GET http://localhost:3000/api/v1/health`
  - Authentication: `POST http://localhost:3000/api/v1/auth/login`
  - User Profiles: `GET http://localhost:3000/api/v1/users/me`
- **Environment Configuration**:
  ```typescript
  // projects/<app>/src/environments/environment.ts (Development)
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api/v1',
    socketUrl: 'http://localhost:3000',
    appUrls: {
      landing: 'http://localhost:4001',
      auth: 'http://localhost:4002',
      dashboard: 'http://localhost:4000'
    }
  };
  ```
- **CORS & Credentials**:
  - The API Gateway supports requests from ports `4000`, `4001`, `4002`, and `4200` with `credentials: true`.
  - Always send `{ withCredentials: true }` in `HttpClient` calls to ensure session cookies and refresh tokens are transmitted.
- **Response Wrapper Standard**:
  All REST responses follow the unified envelope:
  ```json
  {
    "statusCode": 200,
    "message": "Success",
    "data": { ... },
    "meta": {
      "timestamp": "2026-09-13T...",
      "requestId": "..."
    }
  }
  ```
- **Tracing Headers**: The API Gateway returns `X-Correlation-ID` and `X-RateLimit-Remaining` for observability.

### 3. Local Infrastructure Lifecycle

The local backend is controlled via the `infrastructure` repository:

```bash
# Check all backend container states
docker compose -f docker-compose.dev.yml ps

# Verify API Gateway health
curl http://localhost:3000/api/v1/health
```

> [!IMPORTANT]
> **Strict Local-Only Development**: Development stacks run strictly on your local machine. Remote servers (ThinkCentre `172.16.254.2`) are exclusively reserved for Staging and Production CI pipelines.

---

## 💻 Local Development Workflow

### Prerequisites
- Node.js `24.x`
- npm `10.x+`

### Installation
```bash
npm ci --legacy-peer-deps
```

### Starting Development Servers
```bash
# Start all micro-frontends concurrently
npm run dev

# Or run individual applications
npm run dev:dashboard   # Port 4000
npm run dev:landing     # Port 4001
npm run dev:auth        # Port 4002
```

### Compiling Projects
```bash
# Build all micro-frontends (shared-ui -> dashboard -> landing -> auth)
npm run build

# Build individual sub-project
npm run build:shared-ui
npm run build:dashboard
npm run build:landing
npm run build:auth
```

---

## 🛡️ Testing Matrix (5 Quality Layers)

The workspace enforces a 5-layer testing matrix:

| Layer | Type | Target | Command |
| :--- | :--- | :--- | :--- |
| **Layer 1** | Unit & Signal Testing | `shared-ui`, `auth`, `landing`, `dashboard` | `npm run test:all` |
| **Layer 2** | Property-Based Testing (PBT) | Auth guards, layout, user service | `npm run test:property` |
| **Layer 3** | Micro-Frontend Integration | Cross-app auth guard chain & HTTP interceptors | `npm run test:integration` |
| **Layer 4** | Accessibility (a11y) | Playwright Axe-Core automated WCAG AA checks | `npm run test:a11y` |
| **Layer 5** | Mutation Testing | StrykerJS mutation score verification | `npm run test:mutation` |

Run all core layers in a single pass:
```bash
npm run test:all-layers
```

---

## 🐳 Production Docker & Deployment

Each micro-frontend is isolated into its own independent container based on `nginxinc/nginx-unprivileged:1.25-alpine`, standardized on **Port 8080**:

- **Landing**: `docker/landing/Dockerfile.prod` (Nginx `listen 8080;`)
- **Auth**: `docker/auth/Dockerfile.prod` (Nginx `listen 8080;`)
- **Dashboard**: `docker/dashboard/Dockerfile.prod` (Nginx `listen 8080;`)

### CI/CD Pipeline
Continuous integration is orchestrated by Jenkins (`Jenkinsfile`):
1. **Automated Quality Gates**: Runs Layer 1, Layer 2, and Layer 3 tests on every push.
2. **Production Build**: Compiles Angular applications with production environments.
3. **Docker Multi-Image Build & Push**: Builds and tags SemVer + `latest` images to Docker Hub.
4. **Downstream Trigger**: Triggers deployment in `fullstack-infrastructure` with `SERVICES: 'frontend-landing frontend-auth frontend-dashboard nginx'`.

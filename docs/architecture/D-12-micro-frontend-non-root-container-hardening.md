# D-12 Technical Blueprint: Hardening Non-Root User & Container Healthcheck Micro-Frontend

**Document ID**: D-12-SPEC-SSR-CONTAINER-SECURITY-001  
**Author**: Hendro Wijaya, Principal System Architect (Tier 2)  
**Approver**: Arya Pratama, Chief Technology Officer (Tier 1)  
**Stakeholders**: Bagus Wicaksono (Lead Dev), Dian Kartika (Lead QA), DevOps Team (`devops`), Frontend Team (`frontend`)  
**Status**: APPROVED / READY FOR IMPLEMENTATION  
**Target Codebase**: `/home/dedisalam/projects/frontend-web`  

---

## 1. Executive Summary & Problem Analysis

Audit keamanan kontainer yang dijalankan oleh CTO (`/home/dedisalam/scripts/cto_audit_runner.py`) mendeteksi bahwa berkas Dockerfile production untuk seluruh micro-frontend di monorepo `frontend-web` belum memenuhi standar arsitektur keamanan least-privilege dan liveness check:

1. **Root Execution**: Tiga micro-frontend berbasis SSR (`auth`, `dashboard`, `landing`) mengeksekusi proses runtime `node dist/<mfe>/server/server.mjs` sebagai UID 0 (`root`).
2. **Missing Healthcheck**: Ketiga Dockerfile SSR tersebut tidak memiliki instruksi `HEALTHCHECK`.
3. **Implicit Non-Root on SPA**: Satu micro-frontend SPA (`blip`) berbasis `nginxinc/nginx-unprivileged:alpine` belum mendeklarasikan instruksi `USER nginx` secara eksplisit, menyebabkan rule audit statis gagal mendeteksinya sebagai non-root.

---

## 2. Spesifikasi Preskriptif Arsitektur Dockerfile

### 2.1. Spesifikasi `docker/auth/Dockerfile.prod`

```dockerfile
# Stage 1: Build application
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build:shared-ui && npm run build:auth

# Stage 2: Production image with Node.js (Hybrid SSR/CSR)
FROM node:24-alpine AS production

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist/auth ./dist/auth

USER node

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["node", "dist/auth/server/server.mjs"]
```

---

### 2.2. Spesifikasi `docker/dashboard/Dockerfile.prod`

```dockerfile
# Stage 1: Build application
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build:shared-ui && npm run build:dashboard

# Stage 2: Production image with Node.js (Hybrid SSR/CSR)
FROM node:24-alpine AS production

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist/dashboard ./dist/dashboard

USER node

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["node", "dist/dashboard/server/server.mjs"]
```

---

### 2.3. Spesifikasi `docker/landing/Dockerfile.prod`

```dockerfile
# Stage 1: Build application
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build:shared-ui && npm run build:landing

# Stage 2: Production image with Node.js (Hybrid SSR/CSR)
FROM node:24-alpine AS production

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist/landing ./dist/landing

USER node

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["node", "dist/landing/server/server.mjs"]
```

---

### 2.4. Spesifikasi `docker/blip/Dockerfile.prod`

```dockerfile
# Stage 1: Build Application
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build:shared-ui && npm run build:blip

# Stage 2: Production Nginx Serving Single Page Application
FROM nginxinc/nginx-unprivileged:alpine AS production

COPY --from=builder /app/dist/blip/browser /usr/share/nginx/html
COPY docker/blip/nginx.prod.conf /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Matriks Parameter Keamanan & Izin Sistem Berkas

| Parameter | Spesifikasi SSR (`auth`, `dashboard`, `landing`) | Spesifikasi SPA (`blip`) |
|---|---|---|
| **Base Image Builder** | `node:24-alpine` | `node:24-alpine` |
| **Base Image Production** | `node:24-alpine` | `nginxinc/nginx-unprivileged:alpine` |
| **Runtime User** | `node` (UID 1000, GID 1000) | `nginx` (UID 101, GID 101) |
| **App Workdir** | `/app` | `/usr/share/nginx/html` |
| **Ownership Dist Files** | `node:node` via `--chown=node:node` | Default Nginx Unprivileged (`101:101`) |
| **Exposed Port** | `8080` | `8080` |
| **Healthcheck Tool** | `wget -q --spider` (BusyBox Alpine) | `wget -q --spider` (BusyBox Alpine) |
| **Healthcheck Interval** | 30 detik | 30 detik |
| **Healthcheck Timeout** | 3 detik | 3 detik |
| **Healthcheck Start Period** | 5 detik | - |
| **Healthcheck Retries** | 3 kali | 3 kali |

---

## 4. Alur Delegasi dan Review (PP-017, PP-018, PP-019)

1. **Worker DevOps (`devops` - Tier 3)**:
   - Implementasikan seluruh perubahan Dockerfile sesuai Bagian 2.
   - Jalankan verifikasi Golden Contract D-27.
   - Pastikan audit script `python3 /home/dedisalam/scripts/cto_audit_runner.py` memberikan hasil `non_root_user: true` pada keempat micro-frontend.
2. **Lead Dev (`lead-dev` - Tier 2)**:
   - Melakukan code review menyeluruh terhadap berkas Dockerfile yang diperbarui.
3. **Lead QA (`qa` - Tier 2)**:
   - Memvalidasi audit kepatuhan kontainer dan menerbitkan Sertifikat Kualitas D-17 QA Clearance.
4. **CTO (`cto` - Tier 1)**:
   - Skeptical Superior Review & Continuous Delivery ke branch produksi.

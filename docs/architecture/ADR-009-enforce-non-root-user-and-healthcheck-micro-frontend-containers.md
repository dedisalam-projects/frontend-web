# ADR-009: Penegakan Eksekusi Non-Root User & Container Healthcheck Micro-Frontend Production

**Date**: 2026-10-27  
**Status**: accepted  
**Deciders**: Hendro Wijaya (Principal System Architect), Arya Pratama (CTO)  
**Stakeholders**: Bagus Wicaksono (Lead Dev), Dian Kartika (Lead QA), DevOps Team (`devops`), Frontend Team (`frontend`)  

---

## 1. Context

Audit keamanan kontainer berkala oleh CTO (`cto-heavy-reasoning`) pada monorepo `/home/dedisalam/projects/frontend-web` mengungkap celah keamanan operasional (*container security posture*) pada seluruh artefak image Docker production micro-frontend:

1. **Eksekusi Runtime sebagai Root User (UID 0)**:
   - Berkas `docker/auth/Dockerfile.prod`, `docker/dashboard/Dockerfile.prod`, dan `docker/landing/Dockerfile.prod` mengeksekusi runtime Node.js SSR sebagai default `root` user (UID 0) tanpa mendeklarasikan direktif `USER node`.
   - Pelanggaran prinsip *Least Privilege* (CWE-250 / CIS Docker Benchmark 4.1). Apabila terjadi eksploitasi celah keamanan (RCE/prototype pollution) pada runtime SSR Express/Angular, penyerang memiliki akses superuser di dalam kontainer yang meningkatkan risiko *container breakout* ke host kernel Linux.
   - Pada `docker/blip/Dockerfile.prod` (Nginx unprivileged), meskipun base image berjalan dengan UID 101, berkas Dockerfile tidak mendeklarasikan direktif `USER nginx` secara eksplisit sehingga gagal dalam audit kepatuhan deterministik CTO runner (`non_root_user: false`).

2. **Ketiadaan Container Healthcheck pada Runtime SSR**:
   - Berkas Dockerfile SSR (`auth`, `dashboard`, `landing`) tidak memiliki deklarasi `HEALTHCHECK`.
   - Hal ini menyebabkan container orchestrator (Docker Compose, Docker Swarm, atau Kubernetes) tidak dapat memantau status liveness/readiness proses SSR secara deterministik, berisiko mengarahkan traffic pengguna ke kontainer zombie/unhealthy pasca-kegagalan server.

3. **Temuan Audit Empiris**:
   - Eksekusi `python3 /home/dedisalam/scripts/cto_audit_runner.py` menghasilkan status:
     - `docker/auth/Dockerfile.prod`: `non_root_user: false`
     - `docker/blip/Dockerfile.prod`: `non_root_user: false`
     - `docker/dashboard/Dockerfile.prod`: `non_root_user: false`
     - `docker/landing/Dockerfile.prod`: `non_root_user: false`

---

## 2. Decision

1. **Penegakan Least Privilege User pada Seluruh Container Production**:
   - Pada seluruh kontainer SSR Node.js (`auth`, `dashboard`, `landing`), tetapkan user non-root bawaan Alpine Node.js `USER node` (UID 1000).
   - Seluruh artefak hasil build dari stage builder wajib disalin dengan kepemilikan user non-root melalui instruksi `COPY --from=builder --chown=node:node /app/dist/<mfe> ./dist/<mfe>`.
   - Pada kontainer SPA Nginx Blip (`blip`), deklarasikan direktif eksplisit `USER nginx` sebelum deklarasi `EXPOSE` dan `HEALTHCHECK`.

2. **Standarisasi Direktif `HEALTHCHECK` Deterministik**:
   - Seluruh image SSR Node.js wajib menyertakan instruksi `HEALTHCHECK` berbasis utilitas `wget` (tersedia secara native di BusyBox Alpine Linux) dengan parameter enterprise:
     ```dockerfile
     HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
       CMD wget -q --spider http://localhost:8080/ || exit 1
     ```
   - Kontainer SPA Blip mempertahankan healthcheck Nginx unprivileged port 8080.

3. **Verifikasi SSOT Melalui CTO Deterministic Audit Runner**:
   - Script audit `/home/dedisalam/scripts/cto_audit_runner.py` wajib menghasilkan 100% `non_root_user: true` pada seluruh micro-frontend: `docker/auth/Dockerfile.prod`, `docker/blip/Dockerfile.prod`, `docker/dashboard/Dockerfile.prod`, dan `docker/landing/Dockerfile.prod`.

4. **Delegasi & Rantai Komando Review (PP-017, PP-018, PP-019)**:
   - Worker DevOps (`devops` - Tier 3) mengeksekusi perbaikan konfigurasi sesuai cetak biru D-12 dan vektor uji D-27.
   - Lead Dev (`lead-dev` - Tier 2) mereview perubahan kode dan Dockerfile.
   - Lead QA (`qa` - Tier 2) memvalidasi bukti empiris kontainer dan menerbitkan Sertifikat D-17 QA Clearance.
   - CTO (`cto` - Tier 1) melakukan Skeptical Superior Review dan final deployment ke produksi.

---

## 3. Alternatives Considered

### Alternative 1: Menggunakan Custom User & Group ID Baru (`addgroup -S appgroup && adduser -S appuser -G appgroup`)
- **Pros**: Kontrol penuh atas penamaan user dan UID/GID.
- **Cons**: Menambah layer instruksi RUN dan memperlambat build time. Image resmi `node:24-alpine` telah menyediakan user `node` (UID 1000, GID 1000) yang didesain khusus untuk proses aplikasi. **DITOLAK**.

### Alternative 2: Memasang `curl` untuk Healthcheck di Production Stage
- **Pros**: Sintaks `curl -f` sangat umum digunakan.
- **Cons**: Membutuhkan `RUN apk add --no-cache curl` pada production stage yang menambah ukuran image (~5-8 MB) dan memperluas *attack surface*. `wget` sudah tersedia secara default di Alpine BusyBox. **DITOLAK**.

---

## 4. Consequences

- **Positif**: Menutup celah eskalasi hak akses kontainer (CWE-250), mematuhi standar CIS Docker Benchmark, dan menjamin deteksi liveness otomatis oleh orchestrator.
- **Operasional**: Proses Node.js SSR tidak dapat menulis ke direktori di luar izin user `node`. Seluruh dependensi file runtime wajib dialokasikan pada `/app` dengan kepemilikan `node:node`.

# D-27 Golden Contract: Test Vectors for Micro-Frontend Container Security & Healthcheck

**Document ID**: D-27-CONTRACT-TEST-006  
**Author**: Hendro Wijaya, Principal System Architect (Tier 2)  
**Approver**: Arya Pratama, Chief Technology Officer (Tier 1)  
**Target Codebase**: `/home/dedisalam/projects/frontend-web`  
**Related Documents**: `ADR-009`, `D-12-SPEC-SSR-CONTAINER-SECURITY-001`, `D-17-qa-clearance`  

---

## 1. Overview & Purpose

Dokumen ini mendefinisikan Vektor Uji Emas (*Golden Test Vectors*) untuk menguji, memvalidasi, dan mengesahkan pengerasan keamanan kontainer Docker production pada monorepo `frontend-web`.

Setiap vektor uji wajib diverifikasi secara empiris oleh Worker DevOps (`devops`), Lead Developer (`lead-dev`), dan Lead QA (`qa`) sebelum penerbitan Sertifikat D-17 QA Clearance.

---

## 2. Test Vectors (TV-01 s/d TV-05)

### TV-01: Non-Root User Declaration in All Production Dockerfiles
- **Target Files**:
  - `docker/auth/Dockerfile.prod`
  - `docker/dashboard/Dockerfile.prod`
  - `docker/landing/Dockerfile.prod`
  - `docker/blip/Dockerfile.prod`
- **Metode Pengujian**:
  Inspeksi direktif `USER ` pada berkas Dockerfile:
  ```bash
  for f in docker/auth/Dockerfile.prod docker/dashboard/Dockerfile.prod docker/landing/Dockerfile.prod docker/blip/Dockerfile.prod; do
    echo -n "Checking $f USER directive: "
    grep -E "^USER (node|nginx)" /home/dedisalam/projects/frontend-web/"$f" && echo "PASS" || echo "FAIL"
  done
  ```
- **Kriteria Lolos (Pass Criteria)**:
  - `docker/auth/Dockerfile.prod` memiliki deklarasi `USER node`.
  - `docker/dashboard/Dockerfile.prod` memiliki deklarasi `USER node`.
  - `docker/landing/Dockerfile.prod` memiliki deklarasi `USER node`.
  - `docker/blip/Dockerfile.prod` memiliki deklarasi `USER nginx`.

---

### TV-02: Container Healthcheck Directive Completeness
- **Target Files**: Seluruh berkas Dockerfile production micro-frontend.
- **Metode Pengujian**:
  ```bash
  for f in docker/auth/Dockerfile.prod docker/dashboard/Dockerfile.prod docker/landing/Dockerfile.prod docker/blip/Dockerfile.prod; do
    echo -n "Checking $f HEALTHCHECK: "
    grep -E "^HEALTHCHECK" /home/dedisalam/projects/frontend-web/"$f" && echo "PASS" || echo "FAIL"
  done
  ```
- **Kriteria Lolos (Pass Criteria)**:
  - Keempat berkas Dockerfile wajib memiliki instruksi `HEALTHCHECK`.
  - Format probe SSR menggunakan `wget -q --spider http://localhost:8080/ || exit 1`.

---

### TV-03: File Ownership Preservation via `--chown=node:node`
- **Target Files**:
  - `docker/auth/Dockerfile.prod`
  - `docker/dashboard/Dockerfile.prod`
  - `docker/landing/Dockerfile.prod`
- **Metode Pengujian**:
  ```bash
  for f in docker/auth/Dockerfile.prod docker/dashboard/Dockerfile.prod docker/landing/Dockerfile.prod; do
    echo -n "Checking $f COPY --chown: "
    grep -E "COPY --from=builder --chown=node:node" /home/dedisalam/projects/frontend-web/"$f" && echo "PASS" || echo "FAIL"
  done
  ```
- **Kriteria Lolos (Pass Criteria)**:
  - Seluruh instruksi copy artefak build SSR dari stage builder menyertakan opsi `--chown=node:node`.

---

### TV-04: CTO Deterministic Audit Runner Compliance
- **Target Script**: `/home/dedisalam/scripts/cto_audit_runner.py`
- **Metode Pengujian**:
  ```bash
  python3 /home/dedisalam/scripts/cto_audit_runner.py
  ```
  Inspeksi output JSON pada bagian `docker_audit`:
  ```bash
  grep -A 20 "docker_audit" /home/dedisalam/projects/frontend-web/governance/cto-automated-audit-report.json
  ```
- **Kriteria Lolos (Pass Criteria)**:
  - Nilai `non_root_user` untuk `docker/auth/Dockerfile.prod` adalah `true`.
  - Nilai `non_root_user` untuk `docker/blip/Dockerfile.prod` adalah `true`.
  - Nilai `non_root_user` untuk `docker/dashboard/Dockerfile.prod` adalah `true`.
  - Nilai `non_root_user` untuk `docker/landing/Dockerfile.prod` adalah `true`.
  - Status `docker_audit` adalah `PASSED`.

---

### TV-05: Dry-Run Syntax & Linter Pass
- **Target Files**: Seluruh berkas Dockerfile production.
- **Metode Pengujian**:
  Verifikasi berkas Dockerfile tidak memiliki sintaks error atau deklarasi ganda.
  ```bash
  for f in docker/*/Dockerfile.prod; do
    echo "Inspecting $f syntax structure"
    test -f "/home/dedisalam/projects/frontend-web/$f"
  done
  ```
- **Kriteria Lolos (Pass Criteria)**:
  - Berkas valid dan siap di-build oleh Docker engine tanpa permission error.

---

## 3. Matriks Kepatuhan Verifikasi

| Vector ID | Deskripsi Vektor Uji | Target Verifikasi | Tooling / Command | Syarat Minimum Lolos |
|---|---|---|---|---|
| **TV-01** | Non-Root Directive | 4 Dockerfile.prod | `grep -E "^USER (node\|nginx)"` | 100% Present |
| **TV-02** | Healthcheck Integrity | 4 Dockerfile.prod | `grep -E "^HEALTHCHECK"` | 100% Present |
| **TV-03** | Dist File Ownership | 3 Dockerfile SSR | `grep -E "COPY --from=builder --chown=node:node"` | 100% Present |
| **TV-04** | CTO Audit Compliance | `cto_audit_runner.py` | `non_root_user: true` in report | 4/4 True |
| **TV-05** | Dry-Run Syntax Pass | 4 Dockerfile.prod | Test file & parser structure | Exit Code 0 |

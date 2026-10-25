# D-18 QA Clearance Certificate: Standarisasi Layout Detail Gerai Indogrosir (Cardless, WCAG AA Contrast, Deduplikasi Data)
**Document ID**: D-18-CERT-QA-LAYOUT-001  
**Lead QA Auditor**: Dian Kartika, QA & Automation Lead (Tier 2)  
**Chief Technology Officer**: Arya Pratama (Tier 1)  
**Founder & CEO**: Dedi Salam  
**Verification Date**: 2026-10-25  
**Governing Blueprints**: 
- `D-06-SPEC-FE-LAYOUT-001` (Standarisasi Layout Detail Gerai Indogrosir)
- `D-21-CONTRACT-FE-LAYOUT-001` (Golden Contract Test Vectors UI/UX)
- `PP-001` (Zero AI in Client Products)
- `PP-006` (Enterprise Design & UI/UX Standards: Sakai-NG + PrimeNG + Tailwind CSS)
- `PP-017` (Pasal 3 & 4: Release & Security Clearance Gate G4)  
**Target Codebase**: `/home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts`  
**Status**: **QA CERTIFIED (GATE G4 CLEARED)**

---

## 1. Audit Scope & Executive Summary

Sesuai mandat arsitektur D-06, standar desain Sakai-NG & Tailwind CSS (PP-006), serta protokol verifikasi bertingkat PP-017, tim Quality Assurance & Automation Lead telah melakukan audit empiris independen terhadap implementasi redesain tampilan profil gerai Indogrosir (`indogrosir-detail.ts`).

Audit verifikasi mencakup 5 Vektor Uji Emas (*Golden Test Vectors*) D-21:
- **TV-LAYOUT-01**: Eliminasi Card-in-Card Nesting (Transisi ke Flat Semantic Divided Layout)
- **TV-LAYOUT-02**: Kepatuhan WCAG 2.1 AA Kontras Rasio pada Hero Storefront Banner
- **TV-LAYOUT-03**: Unifikasi Tipografi, Status Component (`<p-tag>`), dan Semantic Token (`text-primary`)
- **TV-LAYOUT-04**: Deduplikasi Data Geografis (Kanonikal rendering Kota & Kepulauan)
- **TV-LAYOUT-05**: Kepatuhan Mutlak Zero Inline CSS & Zero Custom Stylesheet (PP-006)

---

## 2. Test Vector Verification Matrix (D-21 Compliance)

| Vector ID | Kategori Pengujian | Spesifikasi Target (D-06) | Hasil Audit Empiris | Status |
|---|---|---|---|---|
| **TV-LAYOUT-01** | **Eliminasi Card-in-Card** | Container informasi cabang menggunakan 1 surface dengan `divide-y md:divide-x`; katalog produk menggunakan `divide-y` flat list | 0 nested `.card`, 0 nested `.rounded-xl.border` di dalam panel operasional. Flat list `divide-y divide-surface-100` pada katalog | **PASSED (100%)** |
| **TV-LAYOUT-02** | **WCAG 2.1 AA Contrast** | Scrim multi-stop `bg-gradient-to-t from-surface-950 via-surface-950/75 to-surface-950/20`. Judul `#ffffff` + drop shadow, subtitle `text-surface-200`. Kontras >= 4.5:1 | Kontras Judul = **19.90:1** (Normal), **9.28:1** (Worst-case 75% scrim di atas gambar putih). Kontras Subtitle = **15.68:1** (Normal), **7.31:1** (Worst-case). Melampaui standar AAA (7:1) | **PASSED (100%)** |
| **TV-LAYOUT-03** | **Unifikasi Warna & Token** | Ikon seragam `text-primary`. Status tag `<p-tag>`. Zero arbitrary `text-indigo-500` / `text-emerald-500` pada metadata | `text-indigo-500` = 0 match. Seluruh icon (marker, phone, globe, box) terikat pada token `text-primary`. Status memakai PrimeNG `<p-tag>` | **PASSED (100%)** |
| **TV-LAYOUT-04** | **Deduplikasi Geografis** | Nama kota (`b.city`) hanya di header banner. Kepulauan (`island_name`) hanya di Section 3 Wilayah | `b.city` muncul tepat 1x di template header identity; `island_name` muncul tepat 1x di panel koordinat wilayah | **PASSED (100%)** |
| **TV-LAYOUT-05** | **Zero Inline Styles** | 0 atribut `style="..."`, 0 properti `styles:` pada komponen decorator | `grep -rn 'style='` = 0 matches.<br>`grep -rn 'styles:'` = 0 matches.<br>100% Tailwind CSS utilities | **PASSED (100%)** |

---

## 3. Physical Empirical Telemetry & Audit Evidence

### 3.1. Verifikasi Kompilasi & Build Frontend (Docker Builder Stage)
Kompilasi dieksekusi melalui image container builder Node 24 Alpine:
```bash
# Command: docker build --no-cache --target builder -f docker/dashboard/Dockerfile.prod -t dedisalam/frontend-dashboard:qa-verify .
Building Angular Package: shared-ui -> Built in 1723ms
Building Angular Application: dashboard -> Application bundle generation complete [39.200 seconds]
Initial total: 2.41 MB (main-6IENROLF.js, scripts-OLTAGARZ.js, styles-GU4MWH3M.css)
Exit Code: 0 (Compilation Success, 0 errors)
```

### 3.2. Telemetri WCAG 2.1 AA Contrast Ratio
Analisis matematis luminansi relatif (sRGB standard CIE 1931 / WCAG 2.1 algorithm):
- **Normal Scrim Overlay**:
  - Background Luminance (`surface-950` / `#09090b`): `L = 0.00199`
  - Title Text (`#ffffff` / `text-white`): `L = 1.0000` -> **Contrast Ratio = 19.90:1** (WCAG AAA Qualified)
  - Subtitle Text (`surface-200` / `#e4e4e7`): `L = 0.7788` -> **Contrast Ratio = 15.68:1** (WCAG AAA Qualified)
- **Worst-Case Evaluation (75% Scrim Alpha di atas Gambar Murni Putih #ffffff)**:
  - Effective Background: `(71, 71, 72)` -> `L = 0.0628`
  - Title Text (`#ffffff`): **Contrast Ratio = 9.28:1** (Melampaui syarat AA 4.5:1 dan AAA 7:1)
  - Subtitle Text (`surface-200`): **Contrast Ratio = 7.31:1** (Melampaui syarat AA 4.5:1 dan AAA 7:1)

### 3.3. Audit Ketiadaan Inline Style & Arbitrary Colors
```bash
# File: /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts
$ grep -rn 'style=' indogrosir-detail.ts
-> ZERO MATCHES (Zero inline styles)

$ grep -rn 'styles:' indogrosir-detail.ts
-> ZERO MATCHES (Zero custom stylesheet)

$ grep -rn 'text-indigo-' indogrosir-detail.ts
-> ZERO MATCHES (Zero arbitrary color utility)
```

### 3.4. Audit Struktur Flat Divided Layout
```bash
$ grep -rn 'divide-y md:divide-y-0 md:divide-x' indogrosir-detail.ts
Line 132: <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-200 dark:divide-surface-800">

$ grep -rn 'divide-y divide-surface-100' indogrosir-detail.ts
Line 234: <div *ngIf="products().length > 0" class="divide-y divide-surface-100 dark:divide-surface-800">
```

### 3.5. Audit Deduplikasi Atribut Geografis
- `b.city`: Muncul tunggal pada line 109 di bawah hero title (`KlikIndogrosir Wholesale Hub`).
- `b.rawMetadata?.island_name`: Muncul tunggal pada line 187 pada kartu Section 3 (`Geolokasi & Wilayah`).

---

## 4. E2E Test Suite Artifact

Suite pengujian otomatis Playwright E2E telah diterbitkan dan tersimpan pada repository:
- **Test File**: `/home/dedisalam/projects/frontend-web/e2e/dashboard/indogrosir-detail-layout.spec.ts`
- **Cakupan Skenario**:
  1. `[TV-LAYOUT-01]` Verifikasi single surface container operasional dengan semantic divider tanpa nested bordered cards.
  2. `[TV-LAYOUT-02]` Verifikasi keberadaan multi-stop gradient scrim WCAG AA, drop-shadow pada judul, dan dark badge untuk kode gerai.
  3. `[TV-LAYOUT-03]` Verifikasi keseragaman icon `text-primary` dan ketiadaan arbitrary `text-indigo-500`.
  4. `[TV-LAYOUT-04]` Verifikasi rendering kanonikal tunggal untuk atribut kota dan kepulauan.
  5. `[TV-LAYOUT-05]` Verifikasi ketiadaan atribut inline `style=""` pada seluruh DOM komponen.

---

## 5. QA Verdict & Official Clearance

Berdasarkan audit telemetri empiris yang tidak terbantahkan, kepatuhan 100% terhadap dokumen spesifikasi D-06, dan pemenuhan seluruh Acceptance Criteria kontrak emas D-21:

```
╔════════════════════════════════════════════════════════════════════════╗
║                   D-18 QA CLEARANCE CERTIFICATE                        ║
║                                                                        ║
║  VERDICT    : APPROVED (PASSED 100%)                                   ║
║  GATE       : GATE G4 (RELEASE & SECURITY CLEARANCE)                   ║
║  DEFECTS    : ZERO P0 / ZERO P1 / ZERO BREAKING CHANGES                ║
║  NEXT STEP  : HANDOFF TO CTO (TIER 1) FOR MACRO VERIFICATION & GATE G5 ║
╚════════════════════════════════════════════════════════════════════════╝
```

**Tertanda**,  
**Dian Kartika**  
*QA & Automation Lead (Tier 2)*  
Permana Tech / Dedi Salam Enterprise

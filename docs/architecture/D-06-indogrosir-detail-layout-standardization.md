# D-06 Technical Blueprint: Standarisasi Layout Detail Gerai Indogrosir (Cardless, WCAG Contrast, Deduplikasi Data)
**Document ID**: D-06-SPEC-FE-LAYOUT-001  
**Author**: Hendro Wijaya, Principal System Architect (Tier 2)  
**Approver**: Arya Pratama, Chief Technology Officer (Tier 1)  
**Target Dev**: Bagus Wicaksono (Lead Dev) & Frontend Team (Tier 3)  
**Target QA**: Dian Kartika, QA & Automation Lead (Tier 2)  
**Status**: APPROVED / READY FOR IMPLEMENTATION  
**Target Codebase**: `/home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts`  

---

## 1. Executive Summary & Problem Formulation

Audit arsitektur UI/UX terhadap komponen detail profil gerai Indogrosir (`indogrosir-detail.ts`) mengidentifikasi 4 anomali desain kritis yang melanggar standar Enterprise Design System (Sakai-NG + PrimeNG + Tailwind CSS) dan regulasi aksesibilitas web:

1. **Card-in-Card Syndrome**: Terdapat 3 level nesting kontainer berbingkai (`border border-surface-200 rounded-xl` di dalam kontainer `rounded-2xl border`, diikuti oleh nesting card pada produk dan pricing tiers). Hal ini menciptakan visual noise berat, margin berlebih, dan melanggar prinsip *cardless / transparent edge-to-edge layout*.
2. **WCAG 2.1 AA Contrast Failure pada Hero Banner**: Overlay banner menggunakan gradient parsial (`via-surface-950/40`) dengan teks sekunder `text-white/80` dan icon `text-emerald-400`. Pada gambar banner berwarna terang atau putih, rasio kontras teks jatuh di bawah 3:1 (syarat minimal WCAG AA normal text adalah 4.5:1).
3. **Penyimpangan Semantik Warna & Tipografi**: Ditemukan penggunaan arbitrary utility colors seperti `text-indigo-500`, `text-emerald-500`, dan `text-primary` yang tidak konsisten pada ikon dan metadata label. Teks key-value tidak memiliki hierarki ritme vertikal seragam.
4. **Redundansi Informasi Geografis**: Entitas `city` dan `island_name` dirender berulang kali: ditampilkan pada banner overlay header, lalu diulang kembali pada Card 1 (Kota) dan Card 3 (Kepulauan).

Cetak biru D-06 ini menetapkan arsitektur layout kanonikal, struktur DOM cardless, skema scrim kontras WCAG AA, dan kontrak uji D-21 untuk memandu implementasi tim Frontend.

---

## 2. Arsitektur Layout Kanonikal (Cardless Layout Architecture)

### 2.1 Dekonstruksi Card-in-Card Menjadi Flat Divided Layout
Sesuai standar Sakai-NG, layout profil gerai dibagi menjadi 3 section utama yang independen dan cardless:

1. **Top Bar & Breadcrumbs**: Navigasi kembali, breadcrumb kontekstual (`KlikIndogrosir Cabang / [CODE]`), judul halaman, dan action bar (`Refresh`, `Semua Cabang`).
2. **Hero Storefront Header (WCAG AA Scrim)**:
   - Full-bleed aspect-ratio container (h-64 sm:h-80).
   - Gradient Scrim deterministik: `bg-gradient-to-t from-surface-950 via-surface-950/80 to-surface-950/20` yang menjamin kontras rasio >= 7:1 di seluruh area teks.
   - Status badge & identity code berlatar belakang solid/dark frosted glass (`bg-surface-900/90 backdrop-blur border border-surface-700/80`).
   - Meta informasi primer tunggal: Nama Cabang, Badge Status, Kota Lokasi, dan Action CTA Google Maps.
3. **Informasi Operasional Gerai (Single Cardless Container with Semantic Grid)**:
   - Menggantikan 3 nested cards menjadi **1 surface container** dengan grid 3 kolom responsif (`grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-200 dark:divide-surface-700`).
   - Tanpa nested border atau nested shadow.
   - Data deduplikasi:
     - **Kolom 1: Alamat Fisik**: Alamat lengkap (`cleanAddress(b.address)`). Tidak menduplikasi baris Kota terpisah.
     - **Kolom 2: Kontak Operasional**: Nomor Telepon, Nomor Fax (kondisional), Jam Operasional / Tipe Layanan.
     - **Kolom 3: Wilayah & Geolokasi**: Kepulauan (`rawMetadata?.island_name`), Koordinat Lintang/Bujur (Lat/Lng font-mono).
4. **Katalog Produk Pemenuhan Cabang (Flat Divided List)**:
   - Eliminasi card berbingkai untuk setiap item produk.
   - Gunakan list berbasis border-bottom (`divide-y divide-surface-100 dark:divide-surface-800`), hover transition halus (`hover:bg-surface-50 dark:hover:bg-surface-800/40`), dan visual hierarchy rapi untuk harga serta tiered pricing.

---

## 3. Spesifikasi Teknis Komponen (Canonical HTML & CSS Spec)

File target: `/home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts`

### 3.1 Spesifikasi Hero Banner & WCAG AA Contrast Scrim
```html
<div class="relative w-full h-64 sm:h-80 bg-surface-950 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-sm">
    <img
        [src]="b.imageUrl || 'https://klikindogrosir.com/web_images/dummy_images/placeholder_banner.png'"
        [alt]="b.name"
        class="w-full h-full object-cover"
        (error)="onImageError($event)"
    />
    <!-- Scrim Multi-stop Gradient Memenuhi WCAG 2.1 AA Kontras >= 7:1 -->
    <div class="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/75 to-surface-950/20"></div>

    <!-- Top Status Badges -->
    <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span class="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-surface-900/90 text-surface-0 border border-surface-700 shadow-md">
            Kode: {{ b.code }}
        </span>
        <p-tag
            [value]="b.isActive ? 'Aktif' : 'Nonaktif'"
            [severity]="b.isActive ? 'success' : 'warn'"
            class="text-xs shadow-md font-semibold"
        />
    </div>

    <!-- Bottom Header Content -->
    <div class="absolute bottom-0 inset-x-0 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
        <div class="flex flex-col gap-1.5">
            <h2 class="m-0 font-bold text-2xl sm:text-3xl text-white tracking-tight drop-shadow-sm">
                {{ b.name }}
            </h2>
            <div class="flex items-center gap-2 text-xs font-medium text-surface-200">
                <i class="pi pi-map-marker text-primary-400"></i>
                <span>{{ b.city || 'Kota Belum Terdaftar' }}</span>
                <span class="text-surface-400">•</span>
                <span>KlikIndogrosir Wholesale Hub</span>
            </div>
        </div>

        <div *ngIf="b.latitude && b.longitude" class="shrink-0">
            <a
                [href]="'https://www.google.com/maps/search/?api=1&query=' + b.latitude + ',' + b.longitude"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-surface-100 text-surface-900 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
                <i class="pi pi-compass text-primary text-sm"></i>
                <span>Buka Google Maps</span>
                <i class="pi pi-arrow-up-right text-[10px] text-surface-500"></i>
            </a>
        </div>
    </div>
</div>
```

### 3.2 Spesifikasi Informasi Operasional Gerai (Flat Cardless Grid)
Menghilangkan struktur 3 nested boxes (`p-4 rounded-xl bg-surface-50 border`). Menggantinya dengan satu panel bergaris pemisah internal (*internal semantic dividers*):

```html
<div class="bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
    <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-200 dark:divide-surface-800">
        <!-- Section 1: Alamat Fisik -->
        <div class="p-5 flex flex-col justify-between gap-3">
            <div>
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
                    <i class="pi pi-map-marker text-primary"></i>
                    <span>Alamat Fisik Gerai</span>
                </div>
                <p class="text-xs text-surface-800 dark:text-surface-200 m-0 leading-relaxed font-medium">
                    {{ cleanAddress(b.address) }}
                </p>
            </div>
            <div class="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs text-muted-color">
                <span>Tipe Lokasi</span>
                <span class="font-semibold text-surface-900 dark:text-surface-100">Gerai & Gudang Logistik</span>
            </div>
        </div>

        <!-- Section 2: Kontak Operasional -->
        <div class="p-5 flex flex-col justify-between gap-3">
            <div>
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
                    <i class="pi pi-phone text-primary"></i>
                    <span>Kontak Operasional</span>
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-muted-color">Telepon:</span>
                        <span class="font-mono font-bold text-surface-900 dark:text-surface-0">{{ b.phone || '-' }}</span>
                    </div>
                    <div *ngIf="b.rawMetadata?.fax" class="flex items-center justify-between text-xs">
                        <span class="text-muted-color">Faksimili:</span>
                        <span class="font-mono text-surface-800 dark:text-surface-200">{{ b.rawMetadata.fax }}</span>
                    </div>
                </div>
            </div>
            <div class="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs text-muted-color">
                <span>Status Layanan</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Aktif Melayani Order
                </span>
            </div>
        </div>

        <!-- Section 3: Wilayah & Geolokasi GPS -->
        <div class="p-5 flex flex-col justify-between gap-3">
            <div>
                <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
                    <i class="pi pi-globe text-primary"></i>
                    <span>Geolokasi & Wilayah</span>
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-muted-color">Wilayah Kepulauan:</span>
                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ b.rawMetadata?.island_name || 'INDONESIA' }}</span>
                    </div>
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-muted-color">Koordinat GPS:</span>
                        <span class="font-mono text-surface-800 dark:text-surface-200">
                            {{ b.latitude || '-' }}, {{ b.longitude || '-' }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs text-muted-color">
                <span>Zona Waktu</span>
                <span class="font-semibold text-surface-900 dark:text-surface-100">WIB / WITA / WIT</span>
            </div>
        </div>
    </div>
</div>
```

### 3.3 Spesifikasi Flat Divided Product List (Eliminasi Nested Cards pada Katalog)
Menggantikan `rounded-xl border bg-surface-50` berulang pada setiap produk menjadi satu kontainer cardless dengan `divide-y`:

```html
<div class="bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
    <!-- Header Bagian Katalog -->
    <div class="p-5 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h5 class="m-0 font-bold text-base text-surface-900 dark:text-surface-0 flex items-center gap-2">
                <i class="pi pi-box text-primary"></i>
                <span>Katalog Produk Pemenuhan Cabang ({{ products().length }})</span>
            </h5>
            <p class="text-xs text-muted-color mt-1 mb-0">
                Daftar produk dengan stok dan pemenuhan langsung dari gerai {{ b.name }}.
            </p>
        </div>
        <p-button
            label="Lihat Semua Produk"
            icon="pi pi-external-link"
            [text]="true"
            size="small"
            routerLink="/products"
        />
    </div>

    <!-- Empty State -->
    <div *ngIf="products().length === 0" class="p-12 text-center text-muted-color">
        <i class="pi pi-inbox text-4xl mb-3 text-surface-400"></i>
        <p class="text-sm font-medium m-0">Belum ada produk yang disinkronkan untuk cabang ini.</p>
    </div>

    <!-- Divided List Item -->
    <div *ngIf="products().length > 0" class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
            *ngFor="let p of products()"
            class="p-5 hover:bg-surface-50/75 dark:hover:bg-surface-800/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
            <div class="flex items-center gap-4">
                <img
                    [src]="p.imageUrl"
                    [alt]="p.name"
                    class="w-16 h-16 object-contain rounded-xl border border-surface-200 dark:border-surface-700 bg-white p-1.5 shrink-0"
                    (error)="onImageError($event)"
                />
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-bold text-primary">PLU: {{ p.plu }}</span>
                        <p-tag
                            [value]="p.isAvailable ? 'Tersedia di Gerai' : 'Stok Habis'"
                            [severity]="p.isAvailable ? 'success' : 'danger'"
                            class="text-xs"
                        />
                    </div>
                    <span class="font-bold text-surface-900 dark:text-surface-0 text-base leading-snug">{{ p.name }}</span>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-muted-color">
                        <span>Merk: <strong class="text-surface-700 dark:text-surface-300">{{ $any(p.brandId)?.name || p.brand || '-' }}</strong></span>
                        <span>•</span>
                        <span>Kategori: <strong class="text-surface-700 dark:text-surface-300">{{ $any(p.categoryId)?.name || p.category || '-' }}</strong></span>
                    </div>
                </div>
            </div>

            <!-- Pricing Stacked Layout -->
            <div class="flex flex-col items-start md:items-end gap-1">
                <span class="text-xs text-muted-color">Harga Retail Gerai</span>
                <div class="flex items-baseline gap-2">
                    <span class="text-lg font-bold text-surface-900 dark:text-surface-0">
                        {{ formatRupiah(p.promoPrice || p.price) }}
                    </span>
                    <span *ngIf="p.promoPrice && p.promoPrice < p.price" class="text-xs text-red-500 line-through">
                        {{ formatRupiah(p.price) }}
                    </span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[11px] text-muted-color">Grosir Terendah:</span>
                    <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(p.lowestPrice || 0) }}</span>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

## 4. D-21 Golden Contract Test Vectors (UI/UX Acceptance Criteria)

| Vector ID | Kategori Pengujian | Kriteria Lolos (Acceptance Criteria) | Metode Verifikasi Empiris |
|---|---|---|---|
| **TV-LAYOUT-01** | **Eliminasi Card-in-Card** | 1. Tidak ada nested class `card` atau nested `rounded-xl border` di dalam kontainer utama info cabang.<br>2. Panel informasi cabang menggunakan `divide-y md:divide-x` tanpa nested bordered cards.<br>3. Katalog produk menggunakan `divide-y` flat list. | Audit selector DOM: `document.querySelectorAll('.rounded-2xl .rounded-xl')` tidak boleh memilih wrapper informasi umum. |
| **TV-LAYOUT-02** | **WCAG 2.1 AA Banner Contrast** | 1. Gradient scrim menggunakan multi-stop `from-surface-950 via-surface-950/75 to-surface-950/20` yang menutupi seluruh gambar.<br>2. Teks nama cabang berwarna `#ffffff` dengan drop shadow.<br>3. Subtitle menggunakan `text-surface-200` dengan rasio kontras >= 4.5:1 terhadap background scrim.<br>4. Kode gerai menggunakan container berlatar solid/dark frosted glass (`bg-surface-900/90 text-surface-0`). | Audit Chrome DevTools Color Contrast Picker pada elemen `.text-white` dan `.text-surface-200`. Kontras >= 4.5:1. |
| **TV-LAYOUT-03** | **Unifikasi Tipografi & Warna** | 1. Ikon panel informasi menggunakan `text-primary` secara seragam (zero arbitrary `text-indigo-500` atau `text-emerald-500`).<br>2. Seluruh status menggunakan komponen `<p-tag>` resmi PrimeNG (`severity="success" | "warn" | "danger"`).<br>3. Key-value label menggunakan `text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400`. | `grep -rn "text-indigo-500" indogrosir-detail.ts` menghasilkan 0 matches.<br>`grep -rn "text-emerald-500" indogrosir-detail.ts` hanya untuk teks harga grosir / badge status. |
| **TV-LAYOUT-04** | **Deduplikasi Data Geografis** | 1. Nama kota (`b.city`) hanya dirender di sub-header banner dan tidak diulang sebagai kartu tersendiri.<br>2. Nama kepulauan (`b.rawMetadata?.island_name`) hanya dirender di Section 3 (Wilayah & Geolokasi) dan tidak diulang di sub-header banner.<br>3. Setiap atribut data memiliki satu lokasi kanonikal. | Analisis visual DOM: Field Kota muncul 1x di header identity; Field Kepulauan muncul 1x di panel wilayah. |
| **TV-LAYOUT-05** | **Zero Custom CSS & Zero Inline Styles** | 1. Tidak ada atribut inline `style="..."`.<br>2. Tidak ada deklarasi CSS kustom pada `@Component.styles`.<br>3. 100% styling menggunakan utility classes Tailwind CSS dan PrimeNG tokens. | `grep -rn 'style="' indogrosir-detail.ts` menghasilkan 0 match.<br>`grep -rn "styles:" indogrosir-detail.ts` menghasilkan 0 match. |

---

## 5. Handoff Matrix & Verification Script for QA & Lead Dev

Implementer (`frontend` - Bagus Wicaksono team) dan QA (`qa` - Dian Kartika) wajib memvalidasi perubahan dengan script verifikasi berikut sebelum mengajukan clearance:

```bash
# 1. Pastikan zero custom CSS dan zero inline styles
grep -rn 'style="' /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts

# 2. Pastikan tidak ada arbitrary colors (indigo-500 pada icon metadata)
grep -rn 'text-indigo-500' /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts

# 3. Verifikasi eliminasi nested background boxes pada section operasional
grep -rn 'bg-surface-50 dark:bg-surface-800/40 border border-surface-100' /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/indogrosir/indogrosir-detail.ts

# 4. Verifikasi compile TypeScript dan build frontend
cd /home/dedisalam/projects/frontend-web && npm run build
```

---

## 6. Architectural Decision Summary (ADR Record)
- **Status**: ACCEPTED
- **Context**: Tampilan detail cabang Indogrosir mengalami degradasi estetika akibat card-in-card nesting, inkonsistensi warna ikon, redundansi teks kota/pulau, dan potensi kegagalan aksesibilitas kontras pada banner latar terang.
- **Decision**: Menerapkan cardless flat layout dengan borderless semantic dividers (`divide-y`/`divide-x`), scrim gelap gradient WCAG 2.1 AA pada hero banner, standardisasi icon semantic token (`text-primary`), dan deduplikasi tampilan kota/pulau.
- **Consequences**: Layout menjadi lebih bersih, mobile-responsive secara alami, memenuhi kriteria WCAG AA, dan sepenuhnya mematuhi prinsip desain Sakai-NG & Tailwind CSS.

# D-21 Golden Contract Test Vectors: PrimeNG Table Standard
**Document ID**: D-21-CONTRACT-FE-TABLE-001  
**Author**: Hendro Wijaya, Principal System Architect (Tier 2)  
**Approver**: Arya Pratama, Chief Technology Officer (Tier 1)  
**Target QA**: Dian Kartika, QA & Automation Lead (Tier 2)  
**Target Dev**: Bagus Wicaksono, Lead Software Engineer (Tier 2) & Frontend Workers (Tier 3)  
**Status**: APPROVED & MANDATORY FOR GATE 2 QA CERTIFICATION  
**Scope**: `products`, `categories`, `branches`, `brands`, `indogrosir`  

---

## 1. Overview & Golden Rule Testing Vectors

Dokumen ini mendefinisikan vektor uji deterministik (*Deterministic Test Vectors*) dan kriteria penerimaan otomatis (*Acceptance Criteria*) yang wajib lolos 100% pada pengujian unit/integrasi/E2E sebelum fitur dapat dideploy ke production.

---

## 2. Test Vector Matrix (D-21 Vectors)

### Vector TV-01: Paging Dinamis (`[rowsPerPageOptions]`)
| Parameter | Spesifikasi Wajib |
|---|---|
| **Property** | `[rowsPerPageOptions]="[10, 20, 50, 100]"` |
| **Initial Rows** | `10` |
| **Paginator Dropdown Selector** | `.p-paginator .p-select` / `.p-paginator-rpp-options` |
| **Paginator Report Pattern** | `Menampilkan {first} sampai {last} dari {totalRecords} [entitas]` |
| **Acceptance Criteria** | 1. Dropdown opsi baris per halaman menampilkan tepat 4 opsi: `10`, `20`, `50`, dan `100`.<br>2. Saat memilih opsi `20`, tabel langsung menampilkan maksimal 20 baris dan template report terupdate seketika.<br>3. Saat memilih opsi `100`, batas render bertambah hingga 100 tanpa exception console.<br>4. Navigasi halaman pertama (`|<<`), sebelumnya (`<`), berikutnya (`>`), dan terakhir (`>>|`) berfungsi deterministik. |

### Vector TV-02: Sort Kolom Interaktif (`pSortableColumn` & `p-sortIcon`)
| Parameter | Spesifikasi Wajib |
|---|---|
| **Directives** | `th[pSortableColumn="field"]` dan `<p-sortIcon field="field">` |
| **Interaction Sequence** | Click 1 (ASC) -> Click 2 (DESC) -> Click 3 (Reset / None) |
| **Visual Indicators** | Icon `pi pi-sort-alt` (unsorted), `pi pi-sort-amount-up-alt` (ASC), `pi pi-sort-amount-down` (DESC) |
| **Acceptance Criteria** | 1. Setiap kolom yang ditentukan sortable memiliki cursor pointer dan teks tidak dapat diseleksi (`select-none`).<br>2. Klik pada header kolom mengubah urutan baris secara real-time pada memori client (untuk client-side collection).<br>3. Nilai string diurutkan secara case-insensitive; nilai angka diurutkan secara numerik presisi.<br>4. Kolom 'Aksi' / tombol operasional DILARANG memiliki `pSortableColumn`. |

### Vector TV-03: Pencarian Global (`Global Filter`)
| Parameter | Spesifikasi Wajib |
|---|---|
| **Component Primitives** | `<p-iconfield>` + `<p-inputicon><i class="pi pi-search"></i></p-inputicon>` + `<input pInputText>` |
| **Event Binding** | `(input)="dt.filterGlobal($any($event.target).value, 'contains')"` |
| **Global Filter Fields** | Didefinisikan eksplisit pada `[globalFilterFields]` di setiap modul |
| **Acceptance Criteria** | 1. Input teks pada kolom search memfilter baris tabel secara instan berdasarkan substring match pada seluruh field yang terdaftar di `globalFilterFields`.<br>2. Input "Bandung" pada modul Branches menampilkan cabang yang memiliki kota atau nama Bandung.<br>3. Menghapus input hingga kosong mengembalikan seluruh data tabel ke kondisi semula tanpa refresh halaman.<br>4. Pencarian yang tidak menemukan hasil menampilkan pesan `#emptymessage` ("Tidak ada data ditemukan"). |

### Vector TV-04: UI/UX & Zero Custom CSS Compliance (PP-006)
| Parameter | Spesifikasi Wajib |
|---|---|
| **Inspection Rule** | Zero inline `style="..."` dan zero custom `.css` rules |
| **Color Tokens** | Sakai-NG Semantic Tokens: `bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700` |
| **Acceptance Criteria** | 1. `grep -rn 'style="' src/app/pages/` mengembalikan 0 hasil (kecuali dynamic style binding seperti progress bar persentase jika ada).<br>2. Tampilan tabel mendukung Light Mode dan Dark Mode dengan kontras rasio minimal WCAG AA (>= 4.5:1).<br>3. Responsive layout tetap proporsional pada resolusi 1280px, 768px, dan 375px (`responsiveLayout="scroll"`). |

---

## 3. Matriks Target Modul & Verification Checklist

| Modul | File Path | Field Sortable | Field Global Search | Rows Per Page |
|---|---|---|---|---|
| **Products** | `projects/dashboard/src/app/pages/products/products.ts` | `name`, `plu`, `category`, `price`, `stock`, `isAvailable` | `plu`, `name`, `brand`, `category` | `[10, 20, 50, 100]` |
| **Categories** | `projects/dashboard/src/app/pages/categories/categories.ts` | `code`, `name`, `divisionCode`, `isActive` | `code`, `name`, `divisionCode`, `departmentCode`, `categoryCode` | `[10, 20, 50, 100]` |
| **Branches** | `projects/dashboard/src/app/pages/branches/branches.ts` | `code`, `name`, `city`, `isActive` | `code`, `name`, `city` | `[10, 20, 50, 100]` |
| **Brands** | `projects/dashboard/src/app/pages/brands/brands.ts` | `code`, `name`, `isActive` | `code`, `name` | `[10, 20, 50, 100]` |
| **Indogrosir** | `projects/dashboard/src/app/pages/indogrosir/indogrosir.ts` | Tabel Cabang: `code`, `name`, `city`, `isActive`<br>Tabel Rekap: `code`, `name`, `departmentCount`, `categoryCount` | Tabel Cabang: `code`, `name`, `city`, `phone`<br>Tabel Rekap: `code`, `name` | `[10, 20, 50, 100]` |

---

## 4. Automated Verification Scripts for QA Team

Tim QA (`qa` - Dian Kartika) dapat mengeksekusi script verifikasi berikut pada terminal:

```bash
# 1. Verifikasi ketersediaan opsi 100 pada rowsPerPageOptions di seluruh modul
grep -rn "rowsPerPageOptions" /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/

# 2. Verifikasi implementasi pSortableColumn pada seluruh target modul
grep -rn "pSortableColumn" /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/

# 3. Verifikasi implementasi filterGlobal / globalFilterFields
grep -rn "filterGlobal" /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/

# 4. Verifikasi zero inline styles
grep -rn 'style="' /home/dedisalam/projects/frontend-web/projects/dashboard/src/app/pages/
```
Semua target modul wajib memiliki bukti grep yang memenuhi kriteria di atas sebelum menandatangani sign-off Gate 2.

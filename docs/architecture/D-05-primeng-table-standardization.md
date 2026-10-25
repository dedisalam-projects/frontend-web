# D-05 Technical Blueprint: PrimeNG Enterprise Table Standardization
**Document ID**: D-05-SPEC-FE-TABLE-001  
**Author**: Hendro Wijaya, Principal System Architect (Tier 2)  
**Approver**: Arya Pratama, Chief Technology Officer (Tier 1)  
**Stakeholders**: Bagus Wicaksono (Lead Dev), Dian Kartika (Lead QA), Frontend Team  
**Status**: APPROVED / READY FOR IMPLEMENTATION  
**Target Codebase**: `/home/dedisalam/projects/frontend-web/projects/dashboard/`  

---

## 1. Executive Summary & Architectural Mandate

Sesuai instruksi Founder & CEO Pak Dedi, seluruh tabel penyajian data pada aplikasi `frontend-web` (Dashboard) wajib distandarisasi menggunakan design system resmi: **Sakai-NG + PrimeNG + Tailwind CSS**.

### Pelanggaran Eksisting yang Harus Dieliminasi:
1. Paging dropdown tidak konsisten (`[5, 10, 20, 50]` atau `[10, 25, 50]`): Pilihan `100` hilang di seluruh modul.
2. Kolom tabel pada `branches`, `brands`, `indogrosir`, dan `products` belum memiliki directive `pSortableColumn` dan komponen `<p-sortIcon>`.
3. Filter pencarian global tidak seragam: sebagian modul menggunakan server fetch parsial tanpa `dt.filterGlobal()`, sementara modul lain (`branches`, `brands`, `categories`) belum memiliki input pencarian global sama sekali.
4. Terdapat sisa atribut `style="min-width: ..."` yang melanggar aturan Golden Rule UI/UX (Zero inline styles).

---

## 2. Definisi Standar Komponen Tabel PrimeNG (Table Canonical Specification)

Setiap tabel data pada modul Dashboard wajib mematuhi template kanonikal berikut:

```html
<div class="card bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden p-4">
    <!-- Optional Toolbar for CRUD actions -->
    <p-toolbar styleClass="mb-4 rounded-lg border border-surface-200 dark:border-surface-700">
        <ng-template #start>
            <!-- Primary Action Buttons -->
        </ng-template>
        <ng-template #end>
            <!-- Secondary Actions (Refresh, Export) -->
        </ng-template>
    </p-toolbar>

    <!-- Standard PrimeNG Table -->
    <p-table
        #dt
        [value]="dataSignal()"
        [rows]="10"
        [paginator]="true"
        [rowsPerPageOptions]="[10, 20, 50, 100]"
        [loading]="loadingSignal()"
        [rowHover]="true"
        [globalFilterFields]="filterFields"
        dataKey="idKey"
        responsiveLayout="scroll"
        currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
        [showCurrentPageReport]="true"
        class="w-full"
    >
        <!-- Table Caption: Title + Global Search Bar -->
        <ng-template #caption>
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                <div class="flex items-center gap-2">
                    <i class="pi [icon-name] text-primary text-xl"></i>
                    <h5 class="m-0 text-xl font-bold">[Entity Title]</h5>
                </div>
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <p-iconfield class="w-full sm:w-72">
                        <p-inputicon>
                            <i class="pi pi-search"></i>
                        </p-inputicon>
                        <input
                            pInputText
                            type="text"
                            (input)="dt.filterGlobal($any($event.target).value, 'contains')"
                            [placeholder]="searchPlaceholder"
                            class="w-full"
                        />
                    </p-iconfield>
                </div>
            </div>
        </ng-template>

        <!-- Table Header with Sortable Columns -->
        <ng-template #header>
            <tr class="border-b border-surface-200 dark:border-surface-700">
                <th
                    *ngFor="let col of cols"
                    [pSortableColumn]="col.sortable ? col.field : null"
                    [class]="col.headerClass || 'p-3 font-semibold text-sm cursor-pointer select-none'"
                >
                    <div class="flex items-center gap-1.5" [ngClass]="col.alignCenter ? 'justify-center' : 'justify-start'">
                        <span>{{ col.header }}</span>
                        <p-sorticon *ngIf="col.sortable" [field]="col.field" />
                    </div>
                </th>
            </tr>
        </ng-template>

        <!-- Table Body -->
        <ng-template #body let-row>
            <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <!-- Cell content rendered with semantic PrimeNG & Tailwind primitives -->
            </tr>
        </ng-template>

        <!-- Empty State Message -->
        <ng-template #emptymessage>
            <tr>
                <td [attr.colspan]="cols.length" class="text-center p-6 text-muted-color">
                    <div class="flex flex-col items-center justify-center py-6">
                        <i class="pi pi-inbox text-3xl mb-2 text-surface-400"></i>
                        <span>Tidak ada data ditemukan.</span>
                    </div>
                </td>
            </tr>
        </ng-template>
    </p-table>
</div>
```

---

## 3. Matriks Spesifikasi Per Target Modul

### 3.1. Modul Produk (`projects/dashboard/src/app/pages/products/products.ts`)
- **Table Ref**: `#dt`
- **Data Source**: `products()`
- **Global Filter Fields**: `['plu', 'name', 'brand', 'category']`
- **Paging Options**: `[10, 20, 50, 100]` (Ubah dari `[10, 20, 50]`)
- **Sortable Columns**:
  1. `name` -> "Produk" (`pSortableColumn="name"`)
  2. `plu` -> "PLU / Barcode" (`pSortableColumn="plu"`)
  3. `category` -> "Kategori" (`pSortableColumn="category"`)
  4. `price` -> "Harga Eceran" (`pSortableColumn="price"`)
  5. `stock` -> "Stok" (`pSortableColumn="stock"`)
  6. `isAvailable` -> "Status" (`pSortableColumn="isAvailable"`)
- **Aksi**: Non-sortable, centered.
- **Search Bar**: Pastikan input search di caption terikat ke `dt.filterGlobal($any($event.target).value, 'contains')` dengan fallback sync ke backend jika query lebih dari 3 karakter.

### 3.2. Modul Kategori (`projects/dashboard/src/app/pages/categories/categories.ts`)
- **Table Refs**: `#dtDiv`, `#dtDept`, `#dtCat`, `#dtAll`
- **Data Sources**: `divisions()`, `departments()`, `categories()`, `categories()`
- **Global Filter Fields**:
  - Divisi: `['code', 'name', 'divisionCode']`
  - Departemen: `['code', 'name', 'departmentCode']`
  - Kategori: `['code', 'name', 'categoryCode']`
  - Semua: `['code', 'name', 'type', 'divisionCode', 'departmentCode']`
- **Paging Options**: `[10, 20, 50, 100]` (Ubah dari `[10, 25, 50]`)
- **Global Search**: Tambahkan `<ng-template #caption>` di setiap tab atau caption bersama dengan p-iconfield search input.
- **Sortable Columns**:
  1. `code` -> "Kode"
  2. `name` -> "Nama Divisi / Dept / Kategori"
  3. `isActive` -> "Status"

### 3.3. Modul Cabang (`projects/dashboard/src/app/pages/branches/branches.ts`)
- **Table Ref**: `#dt`
- **Data Source**: `branches()`
- **Global Filter Fields**: `['code', 'name', 'city']`
- **Paging Options**: `[10, 20, 50, 100]` (Ubah dari `[5, 10, 20, 50]`)
- **Caption Bar**: Tambahkan `#caption` berisi judul dan global search field.
- **Sortable Columns**:
  1. `code` -> "Kode (IGR)" (`pSortableColumn="code"`)
  2. `name` -> "Nama Cabang" (`pSortableColumn="name"`)
  3. `city` -> "Kota" (`pSortableColumn="city"`)
  4. `isActive` -> "Status" (`pSortableColumn="isActive"`)

### 3.4. Modul Brand / Merk (`projects/dashboard/src/app/pages/brands/brands.ts`)
- **Table Ref**: `#dt`
- **Data Source**: `brands()`
- **Global Filter Fields**: `['code', 'name']`
- **Paging Options**: `[10, 20, 50, 100]` (Ubah dari `[5, 10, 20, 50]`)
- **Caption Bar**: Tambahkan `#caption` berisi judul dan global search field.
- **Sortable Columns**:
  1. `code` -> "Kode Brand" (`pSortableColumn="code"`)
  2. `name` -> "Nama Brand / Merk" (`pSortableColumn="name"`)
  3. `isActive` -> "Status" (`pSortableColumn="isActive"`)

### 3.5. Modul Indogrosir (`projects/dashboard/src/app/pages/indogrosir/indogrosir.ts`)
- **Tabel 1 (Daftar Gerai / Cabang)**:
  - **Data Source**: `filteredBranches()`
  - **Global Filter Fields**: `['code', 'name', 'city', 'phone']`
  - **Paging Options**: `[10, 20, 50, 100]` (Ubah dari `[5, 10, 20, 50]`)
  - **Caption Bar**: Tambahkan search input terhubung ke `dtBranch.filterGlobal(...)`.
  - **Sortable Columns**:
    1. `code` -> "Kode IGR" (`pSortableColumn="code"`)
    2. `name` -> "Nama Gerai" (`pSortableColumn="name"`)
    3. `city` -> "Kota / Wilayah" (`pSortableColumn="city"`)
    4. `isActive` -> "Status" (`pSortableColumn="isActive"`)
- **Tabel 2 (Rekapitulasi Divisi & Kategori)**:
  - **Data Source**: `recap()?.categories?.divisions || []`
  - **Global Filter Fields**: `['code', 'name']`
  - **Paging Options**: `[10, 20, 50, 100]` (Ubah dari `[10, 25, 50]`)
  - **Sortable Columns**:
    1. `code` -> "Kode Divisi" (`pSortableColumn="code"`)
    2. `name` -> "Nama Divisi Retail" (`pSortableColumn="name"`)
    3. `departmentCount` -> "Departemen" (`pSortableColumn="departmentCount"`)
    4. `categoryCount` -> "Sub-Kategori" (`pSortableColumn="categoryCount"`)

---

## 4. Architectural Rules & Anti-Pattern Prohibition (Via Negativa)

1. **FORBIDDEN: Custom Inline CSS**:
   Dilarang keras menggunakan atribut `[style.min-width]` atau `style="..."`. Gunakan Tailwind class (`min-w-[40rem]`, `w-full`, dll.).
2. **FORBIDDEN: Missing 100 Option in Dropdown**:
   Seluruh tabel wajib menyediakan opsi `[10, 20, 50, 100]`.
3. **MANDATORY: Global Search via PrimeNG Primitives**:
   Pencarian harus menggunakan `<p-iconfield>` dan `<p-inputicon><i class="pi pi-search"></i></p-inputicon>` yang terstandarisasi di Sakai-NG. Dilarang self-closing tanpa tag `<i>` icon child.
4. **MANDATORY: Sorting Header Contract**:
   Setiap header kolom yang mendukung sort harus memiliki `[pSortableColumn]="field"` dan tag `<p-sortIcon field="field" />` di dalamnya.

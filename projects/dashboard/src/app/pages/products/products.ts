import { Component, OnInit, signal, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TooltipModule } from 'primeng/tooltip';
import {
    IndogrosirProductService,
    IndogrosirProduct,
    ProductStats,
    PricingTier
} from '../service/indogrosir-product.service';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        SelectModule,
        DialogModule,
        ConfirmDialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmdialog></p-confirmdialog>

        <!-- KPI Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div class="card mb-0 bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Total Produk</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ stats()?.totalProducts || 0 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-950 rounded-lg w-10 h-10">
                        <i class="pi pi-box text-blue-600 dark:text-blue-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-emerald-500 font-medium text-xs">{{ stats()?.availableProducts || 0 }} Tersedia</span>
                <span class="text-muted-color text-xs ml-1">dalam katalog</span>
            </div>

            <div class="card mb-0 bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Kategori Produk</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ stats()?.totalCategories || 0 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 rounded-lg w-10 h-10">
                        <i class="pi pi-tags text-indigo-600 dark:text-indigo-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-surface-600 dark:text-surface-400 font-medium text-xs">Divisi Retail Indogrosir</span>
            </div>

            <div class="card mb-0 bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Nilai Inventaris</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ formatRupiah(stats()?.totalInventoryValue || 0) }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 rounded-lg w-10 h-10">
                        <i class="pi pi-wallet text-emerald-600 dark:text-emerald-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-emerald-500 font-medium text-xs">Estimasi Stok Aktif</span>
            </div>

            <div class="card mb-0 bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Sinkronisasi Terakhir</span>
                        <div class="text-surface-900 dark:text-surface-0 font-semibold text-base mt-1">{{ formatDateTime(stats()?.lastSyncTime) }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-950 rounded-lg w-10 h-10">
                        <i class="pi pi-sync text-orange-600 dark:text-orange-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-muted-color text-xs">Sumber: Mobile REST API</span>
            </div>
        </div>

        <!-- Toolbar Actions -->
        <p-toolbar styleClass="mb-6 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
            <ng-template #start>
                <p-button label="Tambah Produk" icon="pi pi-plus" class="mr-2" (onClick)="openNew()" />
                <p-button label="Sinkronisasi KlikIndogrosir" icon="pi pi-refresh" severity="secondary" [loading]="syncing" (onClick)="triggerSync()" class="mr-2" />
                <p-button label="Muat Ulang" icon="pi pi-sync" severity="secondary" [outlined]="true" (onClick)="loadData()" />
            </ng-template>

            <ng-template #end>
                <p-button label="Ekspor CSV" icon="pi pi-upload" severity="secondary" [outlined]="true" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <!-- Main Product Table -->
        <div class="card bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
            <p-table
                #dt
                [value]="products()"
                [rows]="10"
                [paginator]="true"
                [columns]="cols"
                [rowHover]="true"
                [globalFilterFields]="['plu', 'name', 'brand', 'category']"
                dataKey="plu"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} produk"
                [showCurrentPageReport]="true"
                [rowsPerPageOptions]="[10, 20, 50, 100]"
                [loading]="loading"
            >
                <ng-template #caption>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shopping-bag text-primary text-xl"></i>
                            <h5 class="m-0 text-xl font-bold">Katalog Produk KlikIndogrosir</h5>
                        </div>
                        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <p-select
                                [options]="categoryOptions"
                                [(ngModel)]="selectedCategory"
                                placeholder="Semua Kategori"
                                (onChange)="onCategoryFilterChange()"
                                class="w-full sm:w-48"
                            />
                            <p-iconfield class="w-full sm:w-64">
                                <p-inputicon styleClass="pi pi-search" />
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dt.filterGlobal($any($event.target).value, 'contains'); onSearchInput($event)"
                                    placeholder="Cari PLU / Nama / Merk..."
                                    class="w-full"
                                />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr class="border-b border-surface-200 dark:border-surface-700">
                        <th pSortableColumn="name" class="p-3 font-semibold text-sm cursor-pointer select-none">
                            Produk <p-sorticon field="name" />
                        </th>
                        <th pSortableColumn="plu" class="p-3 font-semibold text-sm cursor-pointer select-none">
                            PLU / Barcode <p-sorticon field="plu" />
                        </th>
                        <th pSortableColumn="category" class="p-3 font-semibold text-sm cursor-pointer select-none">
                            Kategori <p-sorticon field="category" />
                        </th>
                        <th pSortableColumn="price" class="p-3 font-semibold text-sm cursor-pointer select-none">
                            Harga Eceran <p-sorticon field="price" />
                        </th>
                        <th class="p-3 font-semibold text-sm">Harga Grosir (Tier)</th>
                        <th pSortableColumn="stock" class="p-3 font-semibold text-sm cursor-pointer select-none">
                            Stok <p-sorticon field="stock" />
                        </th>
                        <th pSortableColumn="isAvailable" class="p-3 font-semibold text-sm cursor-pointer select-none">
                            Status <p-sorticon field="isAvailable" />
                        </th>
                        <th class="p-3 font-semibold text-sm text-center">Aksi</th>
                    </tr>
                </ng-template>

                <ng-template #body let-product>
                    <tr class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                        <td class="p-3">
                            <div class="flex items-center gap-3">
                                <img
                                    [src]="product.imageUrl || 'https://img.klikindogrosir.com/images/products/' + product.plu + '.png'"
                                    [alt]="product.name"
                                    class="w-12 h-12 object-contain rounded-lg border border-surface-200 dark:border-surface-700 bg-white p-1 shrink-0"
                                    (error)="onImageError($event)"
                                />
                                <div class="flex flex-col min-w-0">
                                    <span class="font-bold text-surface-900 dark:text-surface-0 text-sm truncate max-w-xs" [pTooltip]="product.name" tooltipPosition="top">
                                        {{ product.name }}
                                    </span>
                                    <span class="text-xs text-muted-color">Merk: {{ $any(product.brandId)?.name || product.brand || '-' }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="p-3">
                            <div class="flex flex-col">
                                <span class="font-mono text-sm font-semibold text-primary">PLU: {{ product.plu }}</span>
                            </div>
                        </td>
                        <td class="p-3">
                            <p-tag [value]="$any(product.categoryId)?.name || product.category || 'Umum'" severity="info" class="text-xs" />
                        </td>
                        <td class="p-3">
                            <div class="flex flex-col">
                                <span class="font-bold text-surface-900 dark:text-surface-0 text-sm">
                                    {{ formatRupiah(product.promoPrice || product.price) }}
                                </span>
                                <span *ngIf="product.promoPrice && product.promoPrice < product.price" class="text-xs text-red-500 line-through">
                                    {{ formatRupiah(product.price) }}
                                </span>
                            </div>
                        </td>
                        <td class="p-3">
                            <div *ngIf="product.pricingTiers && product.pricingTiers.length > 0; else noTiers" class="flex flex-col gap-1">
                                <span *ngFor="let tier of product.pricingTiers" class="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-700 dark:text-surface-300">
                                    {{ tier.unit }}: {{ formatRupiah(tier.price) }} (min {{ tier.minQty }})
                                </span>
                            </div>
                            <ng-template #noTiers>
                                <span class="text-xs text-muted-color">-</span>
                            </ng-template>
                        </td>
                        <td class="p-3">
                            <span class="font-semibold text-sm">{{ product.stock || 0 }} {{ product.unit || 'PCS' }}</span>
                        </td>
                        <td class="p-3">
                            <p-tag
                                [value]="product.isAvailable ? 'TERSEDIA' : 'HABIS'"
                                [severity]="product.isAvailable ? 'success' : 'danger'"
                                class="text-xs"
                            />
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <p-button
                                    icon="pi pi-pencil"
                                    [rounded]="true"
                                    [outlined]="true"
                                    severity="secondary"
                                    (onClick)="editProduct(product)"
                                    pTooltip="Edit Produk"
                                />
                                <p-button
                                    icon="pi pi-trash"
                                    [rounded]="true"
                                    [outlined]="true"
                                    severity="danger"
                                    (onClick)="deleteProduct(product)"
                                    pTooltip="Hapus Produk"
                                />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="text-center p-6 text-muted-color">
                            <i class="pi pi-inbox text-3xl mb-2 block"></i>
                            Tidak ada produk ditemukan di database.
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Modal Dialog CRUD (Tambah / Edit Produk) -->
        <p-dialog
            [(visible)]="productDialog"
            [header]="dialogTitle"
            [modal]="true"
            [styleClass]="'w-full max-w-2xl'"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 py-2">
                    <div>
                        <label for="plu" class="block font-bold mb-1 text-sm">PLU Produk *</label>
                        <input
                            type="text"
                            pInputText
                            id="plu"
                            [(ngModel)]="product.plu"
                            [disabled]="!isNewProduct"
                            required
                            class="w-full"
                            placeholder="Contoh: 1834271"
                        />
                        <small class="text-red-500" *ngIf="submitted && !product.plu">PLU wajib diisi.</small>
                    </div>

                    <div>
                        <label for="name" class="block font-bold mb-1 text-sm">Nama Produk *</label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="product.name"
                            required
                            class="w-full"
                            placeholder="Contoh: POP MIE INDOMIE GORENG CUP 80G"
                        />
                        <small class="text-red-500" *ngIf="submitted && !product.name">Nama produk wajib diisi.</small>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="brand" class="block font-bold mb-1 text-sm">Merk / Brand</label>
                            <input
                                type="text"
                                pInputText
                                id="brand"
                                [(ngModel)]="product.brand"
                                class="w-full"
                                placeholder="Contoh: INDOMIE"
                            />
                        </div>

                        <div>
                            <label for="category" class="block font-bold mb-1 text-sm">Kategori</label>
                            <p-select
                                [(ngModel)]="product.category"
                                [options]="formCategories"
                                placeholder="Pilih Kategori"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label for="price" class="block font-bold mb-1 text-sm">Harga Normal (Rp) *</label>
                            <p-inputnumber
                                id="price"
                                [(ngModel)]="product.price"
                                mode="decimal"
                                [min]="0"
                                class="w-full"
                            />
                            <small class="text-red-500" *ngIf="submitted && (product.price === undefined || product.price === null)">Harga wajib diisi.</small>
                        </div>

                        <div>
                            <label for="promoPrice" class="block font-bold mb-1 text-sm">Harga Promo (Rp)</label>
                            <p-inputnumber
                                id="promoPrice"
                                [(ngModel)]="product.promoPrice"
                                mode="decimal"
                                [min]="0"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label for="stock" class="block font-bold mb-1 text-sm">Stok (Unit)</label>
                            <p-inputnumber
                                id="stock"
                                [(ngModel)]="product.stock"
                                mode="decimal"
                                [min]="0"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="unit" class="block font-bold mb-1 text-sm">Satuan</label>
                            <input
                                type="text"
                                pInputText
                                id="unit"
                                [(ngModel)]="product.unit"
                                class="w-full"
                                placeholder="PCS / PACK / CTN / POUCH"
                            />
                        </div>

                        <div>
                            <label for="isAvailable" class="block font-bold mb-1 text-sm">Status Ketersediaan</label>
                            <p-select
                                [(ngModel)]="product.isAvailable"
                                [options]="availabilityOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label for="imageUrl" class="block font-bold mb-1 text-sm">URL Gambar Produk</label>
                        <input
                            type="text"
                            pInputText
                            id="imageUrl"
                            [(ngModel)]="product.imageUrl"
                            class="w-full"
                            placeholder="https://img.klikindogrosir.com/images/products/..."
                        />
                    </div>

                    <div>
                        <label for="description" class="block font-bold mb-1 text-sm">Deskripsi Produk</label>
                        <textarea
                            pTextarea
                            id="description"
                            [(ngModel)]="product.description"
                            rows="3"
                            class="w-full"
                            placeholder="Keterangan komposisi, cara penyajian, dan spesifikasi..."
                        ></textarea>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Batal" icon="pi pi-times" [text]="true" (onClick)="hideDialog()" />
                <p-button label="Simpan" icon="pi pi-check" [loading]="saving" (onClick)="saveProduct()" />
            </ng-template>
        </p-dialog>
    `
})
export class Products implements OnInit {
    products = signal<IndogrosirProduct[]>([]);
    stats = signal<ProductStats | null>(null);

    loading: boolean = true;
    saving: boolean = false;
    syncing: boolean = false;

    productDialog: boolean = false;
    submitted: boolean = false;
    isNewProduct: boolean = false;
    dialogTitle: string = 'Detail Produk';

    product: Partial<IndogrosirProduct> = {};
    selectedCategory: string | null = null;
    searchKeyword: string = '';

    categoryOptions: { label: string; value: string | null }[] = [
        { label: 'Semua Kategori', value: null }
    ];

    formCategories: string[] = [
        'SEMBAKO',
        'MAKANAN INSTAN',
        'MINUMAN & SUSU',
        'BUMBU DAPUR',
        'KEBUTUHAN RUMAH TANGGA',
        'PERAWATAN PRIBADI'
    ];

    availabilityOptions = [
        { label: 'Tersedia (In Stock)', value: true },
        { label: 'Habis (Out of Stock)', value: false }
    ];

    @ViewChild('dt') dt!: Table;
    cols!: Column[];

    private productService = inject(IndogrosirProductService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private platformId = inject(PLATFORM_ID);

    ngOnInit() {
        this.cols = [
            { field: 'name', header: 'Produk' },
            { field: 'plu', header: 'PLU' },
            { field: 'category', header: 'Kategori' },
            { field: 'price', header: 'Harga' },
            { field: 'stock', header: 'Stok' },
            { field: 'isAvailable', header: 'Status' }
        ];

        if (isPlatformBrowser(this.platformId)) {
            this.loadData();
        }
    }

    loadData() {
        this.loading = true;
        this.productService.getStats().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.stats.set(res.data);
                    this.categoryOptions = [
                        { label: 'Semua Kategori', value: null },
                        ...res.data.categories.map((c) => ({ label: c, value: c }))
                    ];
                }
            },
            error: (err) => console.warn('Could not load stats:', err)
        });

        this.productService
            .getProducts({
                page: 1,
                limit: 50,
                search: this.searchKeyword || undefined,
                category: this.selectedCategory || undefined
            })
            .subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.products.set(res.data.items || []);
                    }
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Gagal Memuat Produk',
                        detail: err?.message || 'Gagal tersambung ke backend gateway',
                        life: 4000
                    });
                }
            });
    }

    onSearchInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchKeyword = value;
        this.loadData();
    }

    onCategoryFilterChange() {
        this.loadData();
    }

    openNew() {
        this.product = {
            plu: '',
            name: '',
            brand: '',
            category: 'SEMBAKO',
            price: 0,
            promoPrice: 0,
            stock: 0,
            unit: 'PCS',
            isAvailable: true,
            description: '',
            imageUrl: ''
        };
        this.isNewProduct = true;
        this.dialogTitle = 'Tambah Produk Baru';
        this.submitted = false;
        this.productDialog = true;
    }

    editProduct(item: IndogrosirProduct) {
        this.product = { ...item };
        this.isNewProduct = false;
        this.dialogTitle = `Edit Produk (PLU: ${item.plu})`;
        this.submitted = false;
        this.productDialog = true;
    }

    deleteProduct(item: IndogrosirProduct) {
        this.confirmationService.confirm({
            message: `Apakah Anda yakin ingin menghapus produk <b>${item.name}</b> (PLU: ${item.plu})?`,
            header: 'Konfirmasi Hapus Produk',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya, Hapus',
            rejectLabel: 'Batal',
            accept: () => {
                this.productService.deleteProduct(item.plu).subscribe({
                    next: () => {
                        this.products.update((list) => list.filter((p) => p.plu !== item.plu));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Berhasil',
                            detail: `Produk ${item.name} berhasil dihapus`,
                            life: 3000
                        });
                        this.loadData();
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Gagal Hapus',
                            detail: err?.message || 'Terjadi kesalahan saat menghapus',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
        this.saving = false;
    }

    saveProduct() {
        this.submitted = true;

        if (!this.product.plu?.trim() || !this.product.name?.trim() || this.product.price === undefined) {
            return;
        }

        this.saving = true;

        if (this.isNewProduct) {
            this.productService.createProduct(this.product).subscribe({
                next: (res) => {
                    this.saving = false;
                    this.productDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Berhasil Ditambahkan',
                        detail: `Produk ${res.data?.name} berhasil disimpan`,
                        life: 3000
                    });
                    this.loadData();
                },
                error: (err) => {
                    this.saving = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Gagal Menyimpan',
                        detail: err?.error?.message || err?.message || 'Gagal menyimpan produk',
                        life: 4000
                    });
                }
            });
        } else {
            this.productService.updateProduct(this.product.plu!, this.product).subscribe({
                next: (res) => {
                    this.saving = false;
                    this.productDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Berhasil Diperbarui',
                        detail: `Produk ${res.data?.name} berhasil diupdate`,
                        life: 3000
                    });
                    this.loadData();
                },
                error: (err) => {
                    this.saving = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Gagal Memperbarui',
                        detail: err?.error?.message || err?.message || 'Gagal update produk',
                        life: 4000
                    });
                }
            });
        }
    }

    triggerSync() {
        this.syncing = true;
        this.productService.syncCatalog({ branchCode: '04' }).subscribe({
            next: (res) => {
                this.syncing = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sinkronisasi Selesai',
                    detail: `Katalog KlikIndogrosir cabang 04 berhasil disinkronkan (${res.data?.processed || 0} produk).`,
                    life: 4000
                });
                this.loadData();
            },
            error: (err) => {
                this.syncing = false;
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Status Sinkronisasi',
                    detail: err?.message || 'Sinkronisasi selesai dengan fallback katalog resmi.',
                    life: 4000
                });
                this.loadData();
            }
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    formatRupiah(val: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    }

    formatDateTime(dateStr?: string | null): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    onImageError(event: Event) {
        (event.target as HTMLImageElement).src =
            'https://img.klikindogrosir.com/images/products/1834270.png';
    }
}

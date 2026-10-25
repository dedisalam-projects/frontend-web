import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { IndogrosirProductService, Brand } from '../service/indogrosir-product.service';

@Component({
    selector: 'app-brands',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DialogModule,
        ConfirmDialogModule,
        TagModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmdialog></p-confirmdialog>

        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Total Brand / Merek</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ brands().length }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-amber-100 dark:bg-amber-950 rounded-lg w-10 h-10">
                        <i class="pi pi-bookmark text-amber-600 dark:text-amber-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-amber-500 font-medium text-xs">Merek Terdaftar</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Brand Aktif</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ activeCount() }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 rounded-lg w-10 h-10">
                        <i class="pi pi-check-circle text-emerald-600 dark:text-emerald-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-emerald-500 font-medium text-xs">Distribusi Aktif</span>
            </div>
        </div>

        <!-- Main Cardless Data Table -->
        <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <p-button
                        label="Tambah Brand"
                        icon="pi pi-plus"
                        severity="success"
                        class="mr-2"
                        (onClick)="openNew()"
                    />
                </ng-template>
                <ng-template #end>
                    <p-button
                        label="Refresh Data"
                        icon="pi pi-refresh"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="loadBrands()"
                    />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="brands()"
                [rows]="10"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 20, 50, 100]"
                [loading]="loading()"
                [rowHover]="true"
                [globalFilterFields]="['code', 'name']"
                responsiveLayout="scroll"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} brand"
                [showCurrentPageReport]="true"
                class="w-full"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between gap-4">
                        <span class="text-xl font-semibold text-surface-900 dark:text-surface-0">Daftar Brand / Merk</span>
                        <p-iconfield>
                            <p-inputicon>
                                <i class="pi pi-search"></i>
                            </p-inputicon>
                            <input
                                pInputText
                                type="text"
                                (input)="dt.filterGlobal($any($event.target).value, 'contains')"
                                placeholder="Cari kode atau nama brand..."
                                class="w-full sm:w-80"
                            />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr class="border-b border-surface-200 dark:border-surface-700">
                        <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Kode Brand <p-sorticon field="code" />
                        </th>
                        <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Nama Brand / Merk <p-sorticon field="name" />
                        </th>
                        <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Status <p-sorticon field="isActive" />
                        </th>
                        <th class="p-3 text-center font-semibold text-sm w-32">Aksi</th>
                    </tr>
                </ng-template>
                <ng-template #body let-b>
                    <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td class="p-3 font-mono font-bold text-primary">{{ b.code }}</td>
                        <td class="p-3 font-medium">{{ b.name }}</td>
                        <td class="p-3">
                            <p-tag [value]="b.isActive ? 'Aktif' : 'Nonaktif'" [severity]="b.isActive ? 'success' : 'warn'" class="text-xs" />
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex justify-center gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" size="small" (onClick)="editBrand(b)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" size="small" (onClick)="deleteBrand(b)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="4" class="text-center p-6 text-muted-color">Tidak ada data brand ditemukan.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Dialog Form -->
        <p-dialog
            [(visible)]="brandDialog"
            [header]="isNew ? 'Tambah Brand Baru' : 'Edit Brand'"
            [modal]="true"
            [styleClass]="'w-full max-w-lg'"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 py-2">
                    <div>
                        <label for="code" class="block font-bold mb-1 text-sm">Kode Brand (Slug) *</label>
                        <input type="text" pInputText id="code" [(ngModel)]="brand.code" [disabled]="!isNew" class="w-full" placeholder="Contoh: pop-mie" />
                        <small class="text-red-500" *ngIf="submitted && !brand.code">Kode brand wajib diisi.</small>
                    </div>
                    <div>
                        <label for="name" class="block font-bold mb-1 text-sm">Nama Brand / Merk *</label>
                        <input type="text" pInputText id="name" [(ngModel)]="brand.name" class="w-full" placeholder="Contoh: POP MIE" />
                        <small class="text-red-500" *ngIf="submitted && !brand.name">Nama brand wajib diisi.</small>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Batal" icon="pi pi-times" [text]="true" (onClick)="hideDialog()" />
                <p-button label="Simpan" icon="pi pi-check" (onClick)="saveBrand()" />
            </ng-template>
        </p-dialog>
    `
})
export class Brands implements OnInit {
    private productService = inject(IndogrosirProductService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    brands = signal<Brand[]>([]);
    loading = signal<boolean>(false);
    activeCount = signal<number>(0);

    brandDialog = false;
    isNew = false;
    submitted = false;
    brand: Partial<Brand> = {};

    ngOnInit() {
        this.loadBrands();
    }

    loadBrands() {
        this.loading.set(true);
        this.productService.getBrandsList().subscribe({
            next: (res) => {
                const list = res.data || [];
                this.brands.set(list);
                this.activeCount.set(list.filter((b) => b.isActive).length);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat brand: ' + err.message });
                this.loading.set(false);
            }
        });
    }

    openNew() {
        this.brand = { isActive: true };
        this.isNew = true;
        this.submitted = false;
        this.brandDialog = true;
    }

    editBrand(b: Brand) {
        this.brand = { ...b };
        this.isNew = false;
        this.submitted = false;
        this.brandDialog = true;
    }

    hideDialog() {
        this.brandDialog = false;
        this.submitted = false;
    }

    saveBrand() {
        this.submitted = true;
        if (!this.brand.code || !this.brand.name) return;

        if (this.isNew) {
            this.productService.createBrand(this.brand).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Brand berhasil ditambahkan' });
                    this.brandDialog = false;
                    this.loadBrands();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                }
            });
        } else {
            this.productService.updateBrand(this.brand._id!, this.brand).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Brand berhasil diperbarui' });
                    this.brandDialog = false;
                    this.loadBrands();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                }
            });
        }
    }

    deleteBrand(b: Brand) {
        this.confirmationService.confirm({
            message: `Hapus brand ${b.name} (${b.code})?`,
            header: 'Konfirmasi Penghapusan',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.productService.deleteBrand(b._id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Brand dihapus' });
                        this.loadBrands();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                    }
                });
            }
        });
    }
}

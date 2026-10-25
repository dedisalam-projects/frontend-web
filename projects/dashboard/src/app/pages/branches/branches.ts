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
import { IndogrosirProductService, Branch } from '../service/indogrosir-product.service';

@Component({
    selector: 'app-branches',
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Total Cabang</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ branches().length }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-950 rounded-lg w-10 h-10">
                        <i class="pi pi-map-marker text-blue-600 dark:text-blue-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-emerald-500 font-medium text-xs">Jaringan Distribusi</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Cabang Aktif</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ activeCount() }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 rounded-lg w-10 h-10">
                        <i class="pi pi-check-circle text-emerald-600 dark:text-emerald-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-emerald-500 font-medium text-xs">Operasional Penuh</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Cabang Utama</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-xl truncate">04 - BANDUNG</div>
                    </div>
                    <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 rounded-lg w-10 h-10">
                        <i class="pi pi-building text-indigo-600 dark:text-indigo-400 text-xl"></i>
                    </div>
                </div>
                <span class="text-indigo-500 font-medium text-xs">Default Fulfillment</span>
            </div>
        </div>

        <!-- Main Cardless Data Table -->
        <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <p-button
                        label="Tambah Cabang"
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
                        (onClick)="loadBranches()"
                    />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="branches()"
                [rows]="10"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 20, 50, 100]"
                [loading]="loading()"
                [rowHover]="true"
                [globalFilterFields]="['code', 'name', 'city']"
                responsiveLayout="scroll"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} cabang"
                [showCurrentPageReport]="true"
                class="w-full"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between gap-4">
                        <span class="text-xl font-semibold text-surface-900 dark:text-surface-0">Daftar Cabang</span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input
                                pInputText
                                type="text"
                                (input)="dt.filterGlobal($any($event.target).value, 'contains')"
                                placeholder="Cari kode, nama, kota..."
                                class="w-full sm:w-80"
                            />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr class="border-b border-surface-200 dark:border-surface-700">
                        <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Kode (IGR) <p-sorticon field="code" />
                        </th>
                        <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Nama Cabang <p-sorticon field="name" />
                        </th>
                        <th pSortableColumn="city" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Kota <p-sorticon field="city" />
                        </th>
                        <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                            Status <p-sorticon field="isActive" />
                        </th>
                        <th class="p-3 text-center font-semibold text-sm w-32">Aksi</th>
                    </tr>
                </ng-template>
                <ng-template #body let-branch>
                    <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td class="p-3 font-mono font-bold text-primary">{{ branch.code }}</td>
                        <td class="p-3 font-medium">{{ branch.name }}</td>
                        <td class="p-3 text-muted-color">{{ branch.city || '-' }}</td>
                        <td class="p-3">
                            <p-tag [value]="branch.isActive ? 'Aktif' : 'Nonaktif'" [severity]="branch.isActive ? 'success' : 'warn'" class="text-xs" />
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex justify-center gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" size="small" (onClick)="editBranch(branch)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" size="small" (onClick)="deleteBranch(branch)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="5" class="text-center p-6 text-muted-color">Tidak ada data cabang ditemukan.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Dialog Form -->
        <p-dialog
            [(visible)]="branchDialog"
            [header]="isNew ? 'Tambah Cabang Baru' : 'Edit Cabang'"
            [modal]="true"
            [styleClass]="'w-full max-w-lg'"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 py-2">
                    <div>
                        <label for="code" class="block font-bold mb-1 text-sm">Kode Cabang (kode_igr) *</label>
                        <input type="text" pInputText id="code" [(ngModel)]="branch.code" [disabled]="!isNew" class="w-full" placeholder="Contoh: 04" />
                        <small class="text-red-500" *ngIf="submitted && !branch.code">Kode cabang wajib diisi.</small>
                    </div>
                    <div>
                        <label for="name" class="block font-bold mb-1 text-sm">Nama Cabang *</label>
                        <input type="text" pInputText id="name" [(ngModel)]="branch.name" class="w-full" placeholder="Contoh: INDOGROSIR BANDUNG" />
                        <small class="text-red-500" *ngIf="submitted && !branch.name">Nama cabang wajib diisi.</small>
                    </div>
                    <div>
                        <label for="city" class="block font-bold mb-1 text-sm">Kota</label>
                        <input type="text" pInputText id="city" [(ngModel)]="branch.city" class="w-full" placeholder="Contoh: Bandung" />
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Batal" icon="pi pi-times" [text]="true" (onClick)="hideDialog()" />
                <p-button label="Simpan" icon="pi pi-check" (onClick)="saveBranch()" />
            </ng-template>
        </p-dialog>
    `
})
export class Branches implements OnInit {
    private productService = inject(IndogrosirProductService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    branches = signal<Branch[]>([]);
    loading = signal<boolean>(false);
    activeCount = signal<number>(0);

    branchDialog = false;
    isNew = false;
    submitted = false;
    branch: Partial<Branch> = {};

    ngOnInit() {
        this.loadBranches();
    }

    loadBranches() {
        this.loading.set(true);
        this.productService.getBranches().subscribe({
            next: (res) => {
                const list = res.data || [];
                this.branches.set(list);
                this.activeCount.set(list.filter((b) => b.isActive).length);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat cabang: ' + err.message });
                this.loading.set(false);
            }
        });
    }

    openNew() {
        this.branch = { isActive: true };
        this.isNew = true;
        this.submitted = false;
        this.branchDialog = true;
    }

    editBranch(b: Branch) {
        this.branch = { ...b };
        this.isNew = false;
        this.submitted = false;
        this.branchDialog = true;
    }

    hideDialog() {
        this.branchDialog = false;
        this.submitted = false;
    }

    saveBranch() {
        this.submitted = true;
        if (!this.branch.code || !this.branch.name) return;

        if (this.isNew) {
            this.productService.createBranch(this.branch).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Cabang berhasil ditambahkan' });
                    this.branchDialog = false;
                    this.loadBranches();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                }
            });
        } else {
            this.productService.updateBranch(this.branch._id!, this.branch).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Cabang berhasil diperbarui' });
                    this.branchDialog = false;
                    this.loadBranches();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                }
            });
        }
    }

    deleteBranch(b: Branch) {
        this.confirmationService.confirm({
            message: `Hapus cabang ${b.name} (${b.code})?`,
            header: 'Konfirmasi Penghapusan',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.productService.deleteBranch(b._id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Cabang dihapus' });
                        this.loadBranches();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                    }
                });
            }
        });
    }
}

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import {
    IndogrosirProductService,
    IndogrosirRecap,
    BranchIslandSummary,
    CategoryDivisionSummary,
    Branch
} from '../service/indogrosir-product.service';

@Component({
    selector: 'app-indogrosir-overview',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        TagModule,
        ToastModule,
        ProgressBarModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <!-- Header Banner & Action Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h4 class="m-0 font-bold text-2xl text-surface-900 dark:text-surface-0 flex items-center gap-2">
                    <i class="pi pi-chart-bar text-primary text-2xl"></i>
                    Rekapitulasi KlikIndogrosir
                </h4>
                <p class="text-muted-color text-sm mt-1 mb-0">
                    Pusat rekapitulasi komprehensif master data cabang nasional, taksonomi kategori, dan katalog produk.
                </p>
            </div>
            <div class="flex items-center gap-2">
                <p-button
                    label="Refresh Rekap"
                    icon="pi pi-refresh"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="loadRecap()"
                    [loading]="loading()"
                />
                <p-button
                    label="Katalog Produk"
                    icon="pi pi-box"
                    routerLink="/products"
                />
            </div>
        </div>

        <!-- KPI Summary Cards (4 Columns) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <!-- 1. Cabang Nasional -->
            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Total Cabang</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                            {{ recap()?.branches?.total || 0 }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-950 rounded-lg w-10 h-10">
                        <i class="pi pi-map-marker text-blue-600 dark:text-blue-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="text-emerald-500 font-semibold">{{ recap()?.branches?.active || 0 }} Aktif</span>
                    <span class="text-muted-color">• 5 Kepulauan Besar</span>
                </div>
            </div>

            <!-- 2. Kategori Taksonomi -->
            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Total Kategori</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                            {{ recap()?.categories?.total || 0 }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 rounded-lg w-10 h-10">
                        <i class="pi pi-tags text-indigo-600 dark:text-indigo-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="text-indigo-500 font-semibold">{{ recap()?.categories?.levels?.division || 0 }} Divisi</span>
                    <span class="text-muted-color">• {{ recap()?.categories?.levels?.category || 0 }} Sub-Kategori</span>
                </div>
            </div>

            <!-- 3. Produk Terdaftar -->
            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Katalog Produk</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                            {{ recap()?.products?.total || 0 }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 rounded-lg w-10 h-10">
                        <i class="pi pi-box text-emerald-600 dark:text-emerald-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="text-emerald-500 font-semibold">{{ recap()?.products?.available || 0 }} Tersedia</span>
                    <span class="text-muted-color">• {{ recap()?.brands?.total || 0 }} Brand Terdaftar</span>
                </div>
            </div>

            <!-- 4. Nilai Rata-rata & Upstream -->
            <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Rata-rata Harga</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">
                            {{ formatRupiah(recap()?.products?.averagePrice || 0) }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-amber-100 dark:bg-amber-950 rounded-lg w-10 h-10">
                        <i class="pi pi-wallet text-amber-600 dark:text-amber-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="text-emerald-500 font-semibold">Live REST API</span>
                    <span class="text-muted-color">• MitraIndogrosir</span>
                </div>
            </div>
        </div>

        <!-- Section Navigation Pills -->
        <div class="flex flex-wrap items-center gap-2 mb-6">
            <button
                type="button"
                (click)="activeTab.set('cabang')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="activeTab() === 'cabang' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-map-marker"></i>
                Rekapitulasi Cabang ({{ recap()?.branches?.total || 0 }})
            </button>

            <button
                type="button"
                (click)="activeTab.set('kategori')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="activeTab() === 'kategori' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-tags"></i>
                Rekapitulasi Kategori ({{ recap()?.categories?.total || 0 }})
            </button>

            <button
                type="button"
                (click)="activeTab.set('produk')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="activeTab() === 'produk' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-box"></i>
                Rekapitulasi Produk & Harga ({{ recap()?.products?.total || 0 }})
            </button>
        </div>

        <!-- TAB 1: REKAPITULASI CABANG -->
        <div *ngIf="activeTab() === 'cabang'" class="flex flex-col gap-6">
            <!-- Island Summary Distribution Cards -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
                <div class="flex items-center justify-between mb-4">
                    <h5 class="m-0 font-bold text-base text-surface-900 dark:text-surface-0 flex items-center gap-2">
                        <i class="pi pi-globe text-primary"></i>
                        Distribusi Cabang per Wilayah / Kepulauan
                    </h5>
                    <span class="text-xs text-muted-color">Klik wilayah untuk filter tabel</span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <div
                        *ngFor="let isl of recap()?.branches?.byIsland"
                        (click)="toggleIsland(isl.island)"
                        class="cursor-pointer p-3 rounded-lg border transition-all text-center select-none"
                        [ngClass]="selectedIsland() === isl.island ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-surface-50 dark:bg-surface-800/40'"
                    >
                        <div class="font-bold text-lg text-surface-900 dark:text-surface-0">{{ isl.count }}</div>
                        <div class="text-xs font-semibold text-primary mt-0.5">{{ isl.island }}</div>
                        <div class="text-[11px] text-muted-color mt-1">
                            {{ ((isl.count / (recap()?.branches?.total || 1)) * 100) | number:'1.0-0' }}% Nasional
                        </div>
                    </div>
                </div>
            </div>

            <!-- Branch Master Table with Filter -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div class="flex items-center gap-2">
                        <h5 class="m-0 font-bold text-base text-surface-900 dark:text-surface-0">
                            Daftar Gerai Cabang Terdaftar
                        </h5>
                        <p-tag *ngIf="selectedIsland()" [value]="'Filter: ' + selectedIsland()" severity="info" class="text-xs" />
                    </div>
                    <div class="flex items-center gap-2">
                        <p-button
                            *ngIf="selectedIsland()"
                            label="Reset Filter"
                            icon="pi pi-times"
                            [text]="true"
                            size="small"
                            (onClick)="selectedIsland.set('')"
                        />
                        <p-button
                            label="Kelola Cabang"
                            icon="pi pi-external-link"
                            [text]="true"
                            size="small"
                            routerLink="/branches"
                        />
                    </div>
                </div>

                <p-table
                    #dtBranches
                    [value]="filteredBranches()"
                    [rows]="10"
                    [paginator]="true"
                    [rowsPerPageOptions]="[10, 20, 50, 100]"
                    [rowHover]="true"
                    [globalFilterFields]="['code', 'name', 'city', 'phone']"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} cabang"
                    [showCurrentPageReport]="true"
                    class="w-full"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between gap-4">
                            <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Data Gerai Indogrosir</span>
                            <p-iconfield>
                                <p-inputicon>
                                    <i class="pi pi-search"></i>
                                </p-inputicon>
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dtBranches.filterGlobal($any($event.target).value, 'contains')"
                                    placeholder="Cari kode, nama, kota..."
                                    class="w-full sm:w-72"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr class="border-b border-surface-200 dark:border-surface-700">
                            <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Kode IGR <p-sorticon field="code" />
                            </th>
                            <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Nama Gerai <p-sorticon field="name" />
                            </th>
                            <th pSortableColumn="city" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Kota / Wilayah <p-sorticon field="city" />
                            </th>
                            <th class="p-3 text-left font-semibold text-sm">Telepon</th>
                            <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Status <p-sorticon field="isActive" />
                            </th>
                            <th class="p-3 text-center font-semibold text-sm w-32">Profil</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-b>
                        <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td class="p-3 font-mono font-bold text-primary">{{ b.code }}</td>
                            <td class="p-3">
                                <div class="flex flex-col">
                                    <a
                                        [routerLink]="['/indogrosir', b._id || b.code]"
                                        class="font-bold text-primary hover:underline text-sm flex items-center gap-1.5 cursor-pointer w-fit"
                                    >
                                        <span>{{ b.name }}</span>
                                        <i class="pi pi-arrow-up-right text-xs"></i>
                                    </a>
                                    <span class="text-xs text-muted-color truncate max-w-md">{{ b.address || '-' }}</span>
                                </div>
                            </td>
                            <td class="p-3 font-medium text-sm">
                                <div class="flex items-center gap-1.5">
                                    <span>{{ b.city || '-' }}</span>
                                    <span *ngIf="b.rawMetadata?.island_name" class="text-[11px] text-muted-color">({{ b.rawMetadata.island_name }})</span>
                                </div>
                            </td>
                            <td class="p-3 text-xs font-mono text-muted-color">{{ b.phone || '-' }}</td>
                            <td class="p-3">
                                <p-tag [value]="b.isActive ? 'Aktif' : 'Nonaktif'" [severity]="b.isActive ? 'success' : 'warn'" class="text-xs" />
                            </td>
                            <td class="p-3 text-center">
                                <p-button
                                    label="Lihat"
                                    icon="pi pi-id-card"
                                    [outlined]="true"
                                    severity="info"
                                    size="small"
                                    [routerLink]="['/indogrosir', b._id || b.code]"
                                />
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="6" class="text-center p-6 text-muted-color">Tidak ada data cabang untuk filter ini.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- TAB 2: REKAPITULASI KATEGORI -->
        <div *ngIf="activeTab() === 'kategori'" class="flex flex-col gap-6">
            <!-- Taxonomy Level Breakdown -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-semibold text-muted-color">Level 1: Divisi</span>
                        <p-tag value="Top Level" severity="contrast" class="text-xs uppercase" />
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ recap()?.categories?.levels?.division || 0 }}</div>
                    <p class="text-xs text-muted-color mt-1 mb-0">Divisi operasional retail utama</p>
                </div>

                <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-semibold text-muted-color">Level 2: Departemen</span>
                        <p-tag value="Mid Level" severity="info" class="text-xs uppercase" />
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ recap()?.categories?.levels?.department || 0 }}</div>
                    <p class="text-xs text-muted-color mt-1 mb-0">Kelompok komoditas & jenis barang</p>
                </div>

                <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-semibold text-muted-color">Level 3: Kategori</span>
                        <p-tag value="Leaf Level" severity="success" class="text-xs uppercase" />
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ recap()?.categories?.levels?.category || 0 }}</div>
                    <p class="text-xs text-muted-color mt-1 mb-0">Kategori produk langsung di katalog</p>
                </div>
            </div>

            <!-- Division Taxonomy Summary Table -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h5 class="m-0 font-bold text-base text-surface-900 dark:text-surface-0">
                            Struktur Divisi & Distribusi Taksonomi
                        </h5>
                        <p class="text-xs text-muted-color mt-0.5 mb-0">
                            19 Divisi resmi KlikIndogrosir beserta jumlah departemen dan sub-kategori aktif di bawahnya.
                        </p>
                    </div>
                    <p-button
                        label="Kelola Kategori"
                        icon="pi pi-external-link"
                        [text]="true"
                        size="small"
                        routerLink="/categories"
                    />
                </div>

                <p-table
                    #dtDiv
                    [value]="recap()?.categories?.divisions || []"
                    [rows]="10"
                    [paginator]="true"
                    [rowsPerPageOptions]="[10, 20, 50, 100]"
                    [rowHover]="true"
                    [globalFilterFields]="['code', 'name']"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} divisi"
                    [showCurrentPageReport]="true"
                    class="w-full"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between gap-4">
                            <span class="text-base font-semibold text-surface-900 dark:text-surface-0">Data Divisi Retail</span>
                            <p-iconfield>
                                <p-inputicon>
                                    <i class="pi pi-search"></i>
                                </p-inputicon>
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dtDiv.filterGlobal($any($event.target).value, 'contains')"
                                    placeholder="Cari kode atau nama divisi..."
                                    class="w-full sm:w-72"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr class="border-b border-surface-200 dark:border-surface-700">
                            <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Kode Divisi <p-sorticon field="code" />
                            </th>
                            <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Nama Divisi Retail <p-sorticon field="name" />
                            </th>
                            <th pSortableColumn="departmentCount" class="p-3 text-center font-semibold text-sm cursor-pointer select-none">
                                Departemen <p-sorticon field="departmentCount" />
                            </th>
                            <th pSortableColumn="categoryCount" class="p-3 text-center font-semibold text-sm cursor-pointer select-none">
                                Sub-Kategori <p-sorticon field="categoryCount" />
                            </th>
                            <th class="p-3 text-left font-semibold text-sm">Porsi Kategori</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-div>
                        <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td class="p-3 font-mono font-bold text-primary">{{ div.code }}</td>
                            <td class="p-3 font-semibold text-surface-900 dark:text-surface-0">{{ div.name }}</td>
                            <td class="p-3 text-center">
                                <span class="bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full text-xs font-semibold text-surface-700 dark:text-surface-300">
                                    {{ div.departmentCount }} Dept
                                </span>
                            </td>
                            <td class="p-3 text-center">
                                <span class="bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                    {{ div.categoryCount }} Kategori
                                </span>
                            </td>
                            <td class="p-3 w-48">
                                <div class="flex items-center gap-2">
                                    <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            class="bg-primary h-2 rounded-full"
                                            [style.width.%]="(div.categoryCount / 19) * 100"
                                        ></div>
                                    </div>
                                    <span class="text-xs font-mono text-muted-color shrink-0">
                                        {{ div.categoryCount }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- TAB 3: REKAPITULASI PRODUK & HARGA -->
        <div *ngIf="activeTab() === 'produk'" class="flex flex-col gap-6">
            <!-- Product Recap Status Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div class="text-sm font-semibold text-muted-color mb-1">Status Ketersediaan</div>
                    <div class="text-2xl font-bold text-emerald-500">
                        {{ recap()?.products?.available || 0 }} / {{ recap()?.products?.total || 0 }} Tersedia
                    </div>
                    <div class="text-xs text-muted-color mt-1">100% Status Stok Valid di Cabang</div>
                </div>

                <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div class="text-sm font-semibold text-muted-color mb-1">Brand / Merek Terkoneksi</div>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                        {{ recap()?.brands?.total || 0 }} Brand
                    </div>
                    <div class="text-xs text-muted-color mt-1">Ternormalisasi ke Master Brand</div>
                </div>

                <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div class="text-sm font-semibold text-muted-color mb-1">Total Nilai Inventaris</div>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                        {{ formatRupiah(recap()?.products?.totalInventoryValue || 0) }}
                    </div>
                    <div class="text-xs text-muted-color mt-1">Kalkulasi Faktual Upstream</div>
                </div>
            </div>

            <!-- Showcase Dokumen Faktual Terintegrasi -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h5 class="m-0 font-bold text-base text-surface-900 dark:text-surface-0">
                            Produk Faktual Aktif & Hasil Normalisasi Relasional
                        </h5>
                        <p class="text-xs text-muted-color mt-0.5 mb-0">
                            Dokumen produk di bawah terhubung penuh ke master cabang, master kategori resmi, dan master brand.
                        </p>
                    </div>
                    <p-button
                        label="Buka Katalog Lengkap"
                        icon="pi pi-external-link"
                        [text]="true"
                        size="small"
                        routerLink="/products"
                    />
                </div>

                <div *ngFor="let p of recap()?.products?.items" class="p-4 rounded-xl border border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <img
                            [src]="p.imageUrl"
                            [alt]="p.name"
                            class="w-16 h-16 object-contain rounded-lg border border-surface-200 dark:border-surface-700 bg-white p-1 shrink-0"
                            (error)="onImageError($event)"
                        />
                        <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-xs font-bold text-primary">PLU: {{ p.plu }}</span>
                                <p-tag [value]="p.isAvailable ? 'Tersedia' : 'Habis'" [severity]="p.isAvailable ? 'success' : 'danger'" class="text-xs" />
                            </div>
                            <span class="font-bold text-surface-900 dark:text-surface-0 text-base mt-0.5">{{ p.name }}</span>
                            <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-color">
                                <span>Merk: <strong class="text-surface-700 dark:text-surface-300">{{ $any(p.brandId)?.name || '-' }}</strong></span>
                                <span>•</span>
                                <span>Kategori: <strong class="text-surface-700 dark:text-surface-300">{{ $any(p.categoryId)?.name || '-' }}</strong></span>
                                <span>•</span>
                                <span>Cabang: <a [routerLink]="['/indogrosir', $any(p.branchId)?._id || p.branchCode]" class="font-bold text-primary hover:underline cursor-pointer">{{ $any(p.branchId)?.name || '-' }}</a></span>
                            </div>
                        </div>
                    </div>

                    <!-- Pricing Info -->
                    <div class="flex flex-col items-start md:items-end">
                        <span class="text-xs text-muted-color">Harga Retail Normal / Promo</span>
                        <div class="flex items-baseline gap-2">
                            <span class="text-lg font-bold text-surface-900 dark:text-surface-0">
                                {{ formatRupiah(p.promoPrice || p.price) }}
                            </span>
                            <span *ngIf="p.promoPrice && p.promoPrice < p.price" class="text-xs text-red-500 line-through">
                                {{ formatRupiah(p.price) }}
                            </span>
                        </div>
                        <div class="flex items-center gap-1 mt-1">
                            <span class="text-[11px] text-muted-color">Harga Grosir Terendah:</span>
                            <span class="text-xs font-bold text-emerald-500">{{ formatRupiah(p.lowestPrice || 0) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Tier Pricing Table for Product -->
                <div *ngIf="recap()?.products?.items?.[0]?.pricingTiers as tiers" class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                    <span class="block font-semibold text-xs text-surface-700 dark:text-surface-300 mb-2">
                        Tiering Harga Grosir Bertingkat (Upstream Indogrosir):
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div *ngFor="let t of tiers; let idx = index" class="p-3 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                            <div class="text-xs text-muted-color">Tier {{ idx + 1 }} (Min. {{ t.minQty }} {{ t.unit }})</div>
                            <div class="text-base font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                                {{ formatRupiah(t.price) }}
                            </div>
                            <div class="text-[11px] text-muted-color mt-0.5">Fraksi Satuan: {{ t.fraction }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Indogrosir implements OnInit {
    private productService = inject(IndogrosirProductService);
    private messageService = inject(MessageService);

    recap = signal<IndogrosirRecap | null>(null);
    loading = signal<boolean>(false);
    activeTab = signal<'cabang' | 'kategori' | 'produk'>('cabang');
    selectedIsland = signal<string>('');

    filteredBranches = computed(() => {
        const items = this.recap()?.branches?.items || [];
        const island = this.selectedIsland();
        if (!island) return items;
        return items.filter((b: any) => {
            const rawIsland = b.rawMetadata?.island_name || '';
            return rawIsland.trim().toUpperCase() === island.trim().toUpperCase();
        });
    });

    toggleIsland(island: string) {
        if (this.selectedIsland() === island) {
            this.selectedIsland.set('');
        } else {
            this.selectedIsland.set(island);
        }
    }

    ngOnInit() {
        this.loadRecap();
    }

    loadRecap() {
        this.loading.set(true);
        this.productService.getRecap().subscribe({
            next: (res) => {
                if (res.data) {
                    this.recap.set(res.data);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Gagal Memuat Rekap',
                    detail: err.error?.message || err.message
                });
                this.loading.set(false);
            }
        });
    }

    formatRupiah(val: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    }

    onImageError(event: any) {
        event.target.src = 'https://klikindogrosir.com/web_images/dummy_images/placeholder_banner.png';
    }
}

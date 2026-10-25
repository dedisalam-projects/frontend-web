import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, SortEvent } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { IndogrosirProductService, Category } from '../service/indogrosir-product.service';

@Component({
    selector: 'app-categories',
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
        SelectModule,
        DialogModule,
        ConfirmDialogModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmdialog></p-confirmdialog>

        <!-- KPI Hierarchy Summary Cards (4 Cards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- 1. Divisi -->
            <div
                (click)="selectedTab.set('division')"
                class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border transition-all cursor-pointer shadow-sm select-none"
                [ngClass]="selectedTab() === 'division' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'"
            >
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Level 1: Divisi</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ divisionCount() }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-950 rounded-lg w-10 h-10">
                        <i class="pi pi-th-large text-blue-600 dark:text-blue-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <p-tag value="Top Level" severity="contrast" class="text-[10px]" />
                    <span>Klasifikasi Retail Utama</span>
                </div>
            </div>

            <!-- 2. Departemen -->
            <div
                (click)="selectedTab.set('department')"
                class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border transition-all cursor-pointer shadow-sm select-none"
                [ngClass]="selectedTab() === 'department' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'"
            >
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Level 2: Departemen</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ departmentCount() }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 rounded-lg w-10 h-10">
                        <i class="pi pi-sitemap text-indigo-600 dark:text-indigo-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-indigo-500 font-semibold">
                    <p-tag value="Mid Level" severity="info" class="text-[10px]" />
                    <span>Kelompok Komoditas</span>
                </div>
            </div>

            <!-- 3. Kategori -->
            <div
                (click)="selectedTab.set('category')"
                class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border transition-all cursor-pointer shadow-sm select-none"
                [ngClass]="selectedTab() === 'category' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'"
            >
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Level 3: Kategori</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ categoryCount() }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 rounded-lg w-10 h-10">
                        <i class="pi pi-tags text-emerald-600 dark:text-emerald-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                    <p-tag value="Leaf Level" severity="success" class="text-[10px]" />
                    <span>Katalog Belanja Langsung</span>
                </div>
            </div>

            <!-- 4. Total -->
            <div
                (click)="selectedTab.set('all')"
                class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border transition-all cursor-pointer shadow-sm select-none"
                [ngClass]="selectedTab() === 'all' ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'"
            >
                <div class="flex justify-between mb-3">
                    <div>
                        <span class="block text-muted-color font-medium mb-1 text-sm">Total Master</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ categories().length }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-amber-100 dark:bg-amber-950 rounded-lg w-10 h-10">
                        <i class="pi pi-database text-amber-600 dark:text-amber-400 text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-muted-color">
                    <span class="text-emerald-500 font-semibold">{{ activeCount() }} Aktif</span>
                    <span>• SOT KlikIndogrosir</span>
                </div>
            </div>
        </div>

        <!-- Hierarchy Navigation Pills -->
        <div class="flex flex-wrap items-center gap-2 mb-6">
            <button
                type="button"
                (click)="selectedTab.set('division')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="selectedTab() === 'division' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-th-large"></i>
                Tabel Divisi ({{ divisionCount() }})
            </button>

            <button
                type="button"
                (click)="selectedTab.set('department')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="selectedTab() === 'department' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-sitemap"></i>
                Tabel Departemen ({{ departmentCount() }})
            </button>

            <button
                type="button"
                (click)="selectedTab.set('category')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="selectedTab() === 'category' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-tags"></i>
                Tabel Kategori ({{ categoryCount() }})
            </button>

            <button
                type="button"
                (click)="selectedTab.set('all')"
                class="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                [ngClass]="selectedTab() === 'all' ? 'bg-primary text-primary-contrast shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'"
            >
                <i class="pi pi-list"></i>
                Semua Taksonomi ({{ categories().length }})
            </button>
        </div>

        <!-- Main Cardless Data Table Container -->
        <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
            <p-toolbar styleClass="mb-4 gap-2">
                <ng-template #start>
                    <p-button
                        label="Tambah Data"
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
                        (onClick)="loadCategories()"
                    />
                </ng-template>
            </p-toolbar>

            <!-- 1. TABEL DIVISI (LEVEL 1) -->
            <div *ngIf="selectedTab() === 'division'">
                <p-table
                    #dtDiv
                    [value]="divisions()"
                    [rows]="10"
                    [paginator]="true"
                    [rowsPerPageOptions]="[10, 20, 50, 100]"
                    [loading]="loading()"
                    [rowHover]="true"
                    [customSort]="true"
                    (sortFunction)="customSort($event)"
                    [globalFilterFields]="['code', 'name', 'divisionCode']"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} divisi"
                    [showCurrentPageReport]="true"
                    class="w-full"
                >
                    <ng-template #caption>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                            <h5 class="m-0 text-xl font-bold">Daftar Divisi</h5>
                            <p-iconfield class="w-full sm:w-72">
                                <p-inputicon>
                                    <i class="pi pi-search"></i>
                                </p-inputicon>
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dtDiv.filterGlobal($any($event.target).value, 'contains')"
                                    placeholder="Cari divisi..."
                                    class="w-full"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr class="border-b border-surface-200 dark:border-surface-700">
                            <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-36">
                                Kode <p-sorticon field="code" />
                            </th>
                            <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Nama Divisi Retail <p-sorticon field="name" />
                            </th>
                            <th pSortableColumn="divisionCode" class="p-3 text-center font-semibold text-sm cursor-pointer select-none w-36">
                                Kode POS <p-sorticon field="divisionCode" />
                            </th>
                            <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-28">
                                Status <p-sorticon field="isActive" />
                            </th>
                            <th class="p-3 text-center font-semibold text-sm w-32">Aksi</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-item>
                        <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td class="p-3 font-mono font-bold text-primary">{{ item.code }}</td>
                            <td class="p-3">
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-surface-900 dark:text-surface-0">{{ item.name }}</span>
                                    <p-tag value="Divisi" severity="contrast" class="text-[10px] uppercase" />
                                </div>
                            </td>
                            <td class="p-3 text-center font-mono font-semibold text-surface-700 dark:text-surface-300">
                                {{ item.divisionCode || '-' }}
                            </td>
                            <td class="p-3">
                                <p-tag [value]="item.isActive ? 'Aktif' : 'Nonaktif'" [severity]="item.isActive ? 'success' : 'warn'" class="text-xs" />
                            </td>
                            <td class="p-3 text-center">
                                <div class="flex justify-center gap-2">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" size="small" (onClick)="editCategory(item)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" size="small" (onClick)="deleteCategory(item)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- 2. TABEL DEPARTEMEN (LEVEL 2) -->
            <div *ngIf="selectedTab() === 'department'">
                <p-table
                    #dtDept
                    [value]="departments()"
                    [rows]="10"
                    [paginator]="true"
                    [rowsPerPageOptions]="[10, 20, 50, 100]"
                    [loading]="loading()"
                    [rowHover]="true"
                    [customSort]="true"
                    (sortFunction)="customSort($event)"
                    [globalFilterFields]="['code', 'name', 'divisionCode', 'departmentCode']"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} departemen"
                    [showCurrentPageReport]="true"
                    class="w-full"
                >
                    <ng-template #caption>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                            <h5 class="m-0 text-xl font-bold">Daftar Departemen</h5>
                            <p-iconfield class="w-full sm:w-72">
                                <p-inputicon>
                                    <i class="pi pi-search"></i>
                                </p-inputicon>
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dtDept.filterGlobal($any($event.target).value, 'contains')"
                                    placeholder="Cari departemen..."
                                    class="w-full"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr class="border-b border-surface-200 dark:border-surface-700">
                            <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-36">
                                Kode <p-sorticon field="code" />
                            </th>
                            <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Nama Departemen <p-sorticon field="name" />
                            </th>
                            <th pSortableColumn="divisionCode" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Divisi Induk <p-sorticon field="divisionCode" />
                            </th>
                            <th pSortableColumn="departmentCode" class="p-3 text-center font-semibold text-sm cursor-pointer select-none w-32">
                                Kode Dept <p-sorticon field="departmentCode" />
                            </th>
                            <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-28">
                                Status <p-sorticon field="isActive" />
                            </th>
                            <th class="p-3 text-center font-semibold text-sm w-32">Aksi</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-item>
                        <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td class="p-3 font-mono font-bold text-indigo-500">{{ item.code }}</td>
                            <td class="p-3 font-semibold text-surface-900 dark:text-surface-0">{{ item.name }}</td>
                            <td class="p-3">
                                <span class="px-2 py-0.5 rounded text-xs bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 font-medium">
                                    {{ getDivisionName(item.divisionCode) }}
                                </span>
                            </td>
                            <td class="p-3 text-center font-mono font-semibold text-surface-700 dark:text-surface-300">
                                {{ item.departmentCode || '-' }}
                            </td>
                            <td class="p-3">
                                <p-tag [value]="item.isActive ? 'Aktif' : 'Nonaktif'" [severity]="item.isActive ? 'success' : 'warn'" class="text-xs" />
                            </td>
                            <td class="p-3 text-center">
                                <div class="flex justify-center gap-2">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" size="small" (onClick)="editCategory(item)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" size="small" (onClick)="deleteCategory(item)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- 3. TABEL KATEGORI (LEVEL 3) -->
            <div *ngIf="selectedTab() === 'category'">
                <p-table
                    #dtKat
                    [value]="leafCategories()"
                    [rows]="10"
                    [paginator]="true"
                    [rowsPerPageOptions]="[10, 20, 50, 100]"
                    [loading]="loading()"
                    [rowHover]="true"
                    [customSort]="true"
                    (sortFunction)="customSort($event)"
                    [globalFilterFields]="['code', 'name', 'divisionCode', 'departmentCode']"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} kategori"
                    [showCurrentPageReport]="true"
                    class="w-full"
                >
                    <ng-template #caption>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                            <h5 class="m-0 text-xl font-bold">Daftar Kategori</h5>
                            <p-iconfield class="w-full sm:w-72">
                                <p-inputicon>
                                    <i class="pi pi-search"></i>
                                </p-inputicon>
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dtKat.filterGlobal($any($event.target).value, 'contains')"
                                    placeholder="Cari kategori..."
                                    class="w-full"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr class="border-b border-surface-200 dark:border-surface-700">
                            <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-36">
                                Kode <p-sorticon field="code" />
                            </th>
                            <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Nama Kategori <p-sorticon field="name" />
                            </th>
                            <th pSortableColumn="divisionCode" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Divisi Induk <p-sorticon field="divisionCode" />
                            </th>
                            <th pSortableColumn="departmentCode" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Departemen Induk <p-sorticon field="departmentCode" />
                            </th>
                            <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-28">
                                Status <p-sorticon field="isActive" />
                            </th>
                            <th class="p-3 text-center font-semibold text-sm w-32">Aksi</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-item>
                        <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td class="p-3 font-mono font-bold text-emerald-500">{{ item.code }}</td>
                            <td class="p-3 font-semibold text-surface-900 dark:text-surface-0">{{ item.name }}</td>
                            <td class="p-3">
                                <span class="px-2 py-0.5 rounded text-xs bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium">
                                    {{ getDivisionName(item.divisionCode) }}
                                </span>
                            </td>
                            <td class="p-3">
                                <span class="px-2 py-0.5 rounded text-xs bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium">
                                    {{ getDepartmentName(item.departmentCode) }}
                                </span>
                            </td>
                            <td class="p-3">
                                <p-tag [value]="item.isActive ? 'Aktif' : 'Nonaktif'" [severity]="item.isActive ? 'success' : 'warn'" class="text-xs" />
                            </td>
                            <td class="p-3 text-center">
                                <div class="flex justify-center gap-2">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" size="small" (onClick)="editCategory(item)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" size="small" (onClick)="deleteCategory(item)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- 4. TABEL SEMUA TAKSONOMI -->
            <div *ngIf="selectedTab() === 'all'">
                <p-table
                    #dtAll
                    [value]="categories()"
                    [rows]="10"
                    [paginator]="true"
                    [rowsPerPageOptions]="[10, 20, 50, 100]"
                    [loading]="loading()"
                    [rowHover]="true"
                    [customSort]="true"
                    (sortFunction)="customSort($event)"
                    [globalFilterFields]="['code', 'name', 'type', 'divisionCode', 'departmentCode']"
                    responsiveLayout="scroll"
                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} kategori"
                    [showCurrentPageReport]="true"
                    class="w-full"
                >
                    <ng-template #caption>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                            <h5 class="m-0 text-xl font-bold">Semua Taksonomi</h5>
                            <p-iconfield class="w-full sm:w-72">
                                <p-inputicon>
                                    <i class="pi pi-search"></i>
                                </p-inputicon>
                                <input
                                    pInputText
                                    type="text"
                                    (input)="dtAll.filterGlobal($any($event.target).value, 'contains')"
                                    placeholder="Cari taksonomi..."
                                    class="w-full"
                                />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr class="border-b border-surface-200 dark:border-surface-700">
                            <th pSortableColumn="code" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-36">
                                Kode <p-sorticon field="code" />
                            </th>
                            <th pSortableColumn="name" class="p-3 text-left font-semibold text-sm cursor-pointer select-none">
                                Nama Kategori <p-sorticon field="name" />
                            </th>
                            <th pSortableColumn="level" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-36">
                                Hirarki <p-sorticon field="level" />
                            </th>
                            <th class="p-3 text-left font-semibold text-sm">Induk Taksonomi</th>
                            <th pSortableColumn="isActive" class="p-3 text-left font-semibold text-sm cursor-pointer select-none w-28">
                                Status <p-sorticon field="isActive" />
                            </th>
                            <th class="p-3 text-center font-semibold text-sm w-32">Aksi</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-cat>
                        <tr class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td class="p-3 font-mono font-bold text-primary">{{ cat.code }}</td>
                            <td class="p-3 font-medium">{{ cat.name }}</td>
                            <td class="p-3">
                                <p-tag
                                    [value]="cat.level || 'category'"
                                    [severity]="cat.level === 'division' ? 'contrast' : cat.level === 'department' ? 'info' : 'success'"
                                    class="text-xs uppercase"
                                />
                            </td>
                            <td class="p-3 text-xs text-muted-color">
                                <div *ngIf="cat.level === 'category'">
                                    {{ getDivisionName(cat.divisionCode) }} &gt; {{ getDepartmentName(cat.departmentCode) }}
                                </div>
                                <div *ngIf="cat.level === 'department'">
                                    Divisi: {{ getDivisionName(cat.divisionCode) }}
                                </div>
                                <div *ngIf="cat.level === 'division'">
                                    -
                                </div>
                            </td>
                            <td class="p-3">
                                <p-tag [value]="cat.isActive ? 'Aktif' : 'Nonaktif'" [severity]="cat.isActive ? 'success' : 'warn'" class="text-xs" />
                            </td>
                            <td class="p-3 text-center">
                                <div class="flex justify-center gap-2">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" size="small" (onClick)="editCategory(cat)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" size="small" (onClick)="deleteCategory(cat)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- Dialog Form Tambah / Edit -->
        <p-dialog
            [(visible)]="categoryDialog"
            [header]="isNew ? 'Tambah Taksonomi Baru' : 'Edit Taksonomi'"
            [modal]="true"
            [styleClass]="'w-full max-w-lg'"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 py-2">
                    <div>
                        <label for="level" class="block font-bold mb-1 text-sm">Tingkat Hirarki *</label>
                        <p-select
                            id="level"
                            [options]="levelOptions"
                            [(ngModel)]="category.level"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label for="code" class="block font-bold mb-1 text-sm">Kode (Slug / Code) *</label>
                        <input type="text" pInputText id="code" [(ngModel)]="category.code" [disabled]="!isNew" class="w-full" placeholder="Contoh: div-29, dep-64, kat-83" />
                        <small class="text-red-500" *ngIf="submitted && !category.code">Kode wajib diisi.</small>
                    </div>
                    <div>
                        <label for="name" class="block font-bold mb-1 text-sm">Nama Taksonomi *</label>
                        <input type="text" pInputText id="name" [(ngModel)]="category.name" class="w-full" placeholder="Contoh: MIE INSTANT" />
                        <small class="text-red-500" *ngIf="submitted && !category.name">Nama wajib diisi.</small>
                    </div>
                    <div class="grid grid-cols-2 gap-3" *ngIf="category.level !== 'division'">
                        <div>
                            <label for="divisionCode" class="block font-bold mb-1 text-sm">Kode Divisi POS</label>
                            <input type="text" pInputText id="divisionCode" [(ngModel)]="category.divisionCode" class="w-full" placeholder="Contoh: 29" />
                        </div>
                        <div *ngIf="category.level === 'category'">
                            <label for="departmentCode" class="block font-bold mb-1 text-sm">Kode Dept POS</label>
                            <input type="text" pInputText id="departmentCode" [(ngModel)]="category.departmentCode" class="w-full" placeholder="Contoh: 64" />
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Batal" icon="pi pi-times" [text]="true" (onClick)="hideDialog()" />
                <p-button label="Simpan" icon="pi pi-check" (onClick)="saveCategory()" />
            </ng-template>
        </p-dialog>
    `
})
export class Categories implements OnInit {
    private productService = inject(IndogrosirProductService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    categories = signal<Category[]>([]);
    loading = signal<boolean>(false);
    activeCount = signal<number>(0);
    selectedTab = signal<'division' | 'department' | 'category' | 'all'>('division');

    categoryDialog = false;
    isNew = false;
    submitted = false;
    category: Partial<Category> = {};

    levelOptions = [
        { label: 'Level 1: Divisi', value: 'division' },
        { label: 'Level 2: Departemen', value: 'department' },
        { label: 'Level 3: Kategori', value: 'category' }
    ];

    divisions = computed(() => this.categories().filter((c: any) => c.level === 'division'));
    departments = computed(() => this.categories().filter((c: any) => c.level === 'department'));
    leafCategories = computed(() => this.categories().filter((c: any) => c.level === 'category'));

    divisionCount = computed(() => this.divisions().length);
    departmentCount = computed(() => this.departments().length);
    categoryCount = computed(() => this.leafCategories().length);

    divisionMap = computed(() => {
        const map = new Map<string, string>();
        for (const c of this.categories()) {
            if (c.level === 'division' && c.divisionCode) {
                map.set(c.divisionCode, c.name);
            }
        }
        return map;
    });

    departmentMap = computed(() => {
        const map = new Map<string, string>();
        for (const c of this.categories()) {
            if (c.level === 'department' && c.departmentCode) {
                map.set(c.departmentCode, c.name);
            }
        }
        return map;
    });

    ngOnInit() {
        this.loadCategories();
    }

    getDivisionName(code?: string): string {
        if (!code) return '-';
        return this.divisionMap().get(code) || `Div ${code}`;
    }

    getDepartmentName(code?: string): string {
        if (!code) return '-';
        return this.departmentMap().get(code) || `Dept ${code}`;
    }

    customSort(event: SortEvent) {
        if (!event.data) return;
        event.data.sort((data1: any, data2: any) => {
            const value1 = data1[event.field!];
            const value2 = data2[event.field!];
            let result = 0;

            if (value1 == null && value2 != null) result = -1;
            else if (value1 != null && value2 == null) result = 1;
            else if (value1 == null && value2 == null) result = 0;
            else if (event.field === 'code' || event.field === 'divisionCode' || event.field === 'departmentCode') {
                result = String(value1).localeCompare(String(value2), undefined, { numeric: true, sensitivity: 'base' });
            } else if (typeof value1 === 'string' && typeof value2 === 'string') {
                result = value1.localeCompare(value2);
            } else {
                result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
            }

            return (event.order || 1) * result;
        });
    }

    loadCategories() {
        this.loading.set(true);
        this.productService.getCategoriesList().subscribe({
            next: (res) => {
                const list = res.data || [];
                this.categories.set(list);
                this.activeCount.set(list.filter((c) => c.isActive).length);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat kategori: ' + err.message });
                this.loading.set(false);
            }
        });
    }

    openNew() {
        this.category = {
            isActive: true,
            level: this.selectedTab() === 'all' ? 'category' : this.selectedTab()
        };
        this.isNew = true;
        this.submitted = false;
        this.categoryDialog = true;
    }

    editCategory(c: Category) {
        this.category = { ...c };
        this.isNew = false;
        this.submitted = false;
        this.categoryDialog = true;
    }

    hideDialog() {
        this.categoryDialog = false;
        this.submitted = false;
    }

    saveCategory() {
        this.submitted = true;
        if (!this.category.code || !this.category.name) return;

        if (this.isNew) {
            this.productService.createCategory(this.category).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil ditambahkan' });
                    this.categoryDialog = false;
                    this.loadCategories();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                }
            });
        } else {
            this.productService.updateCategory(this.category._id!, this.category).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil diperbarui' });
                    this.categoryDialog = false;
                    this.loadCategories();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                }
            });
        }
    }

    deleteCategory(c: Category) {
        this.confirmationService.confirm({
            message: `Hapus taksonomi ${c.name} (${c.code})?`,
            header: 'Konfirmasi Penghapusan',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.productService.deleteCategory(c._id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Sukses', detail: 'Data berhasil dihapus' });
                        this.loadCategories();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Gagal', detail: err.error?.message || err.message });
                    }
                });
            }
        });
    }
}

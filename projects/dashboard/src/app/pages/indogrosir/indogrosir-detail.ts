import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    IndogrosirProductService,
    Branch,
    IndogrosirProduct
} from '../service/indogrosir-product.service';

@Component({
    selector: 'app-indogrosir-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        TagModule,
        ToastModule,
        TooltipModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <!-- Top Navigation & Breadcrumb -->
        <div class="flex items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
                <p-button
                    icon="pi pi-arrow-left"
                    [outlined]="true"
                    severity="secondary"
                    routerLink="/indogrosir"
                    pTooltip="Kembali ke Rekapitulasi"
                    tooltipPosition="bottom"
                />
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-muted-color">KlikIndogrosir Cabang</span>
                        <span class="text-xs text-muted-color">/</span>
                        <span class="text-xs font-mono font-bold text-primary">{{ branch()?.code || '-' }}</span>
                    </div>
                    <h4 class="m-0 font-bold text-2xl text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ branch()?.name || 'Memuat Data Cabang...' }}
                    </h4>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <p-button
                    label="Semua Cabang"
                    icon="pi pi-map-marker"
                    severity="secondary"
                    [outlined]="true"
                    routerLink="/branches"
                />
                <p-button
                    label="Refresh"
                    icon="pi pi-refresh"
                    [outlined]="true"
                    severity="secondary"
                    (onClick)="loadBranchDetail()"
                    [loading]="loading()"
                />
            </div>
        </div>

        <div *ngIf="loading()" class="p-8 text-center bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
            <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
            <p class="text-muted-color text-sm mt-2 mb-0">Mengambil data profil lengkap cabang...</p>
        </div>

        <div *ngIf="!loading() && branch() as b" class="flex flex-col gap-6">
            <!-- Hero Storefront Banner Card -->
            <div class="relative w-full h-64 sm:h-80 bg-surface-950 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-sm">
                <img
                    [src]="b.imageUrl || 'https://klikindogrosir.com/web_images/dummy_images/placeholder_banner.png'"
                    [alt]="b.name"
                    class="w-full h-full object-cover"
                    (error)="onImageError($event)"
                />
                <!-- Scrim Multi-stop Gradient (WCAG 2.1 AA Kontras >= 7:1) -->
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

            <!-- Informasi Operasional Gerai (Flat Cardless Grid) -->
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

            <!-- Branch Linked Products Section (Flat Divided List) -->
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
        </div>
    `
})
export class IndogrosirDetail implements OnInit {
    private route = inject(ActivatedRoute);
    private productService = inject(IndogrosirProductService);
    private messageService = inject(MessageService);

    branch = signal<Branch | null>(null);
    products = signal<IndogrosirProduct[]>([]);
    loading = signal<boolean>(false);

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.loadBranchDetail(id);
            }
        });
    }

    loadBranchDetail(id?: string) {
        const targetId = id || this.route.snapshot.paramMap.get('id');
        if (!targetId) return;

        this.loading.set(true);
        this.productService.getBranch(targetId).subscribe({
            next: (res) => {
                if (res.data) {
                    this.branch.set(res.data);
                    this.products.set(res.data.products || []);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Gagal Memuat Cabang',
                    detail: err.error?.message || err.message
                });
                this.loading.set(false);
            }
        });
    }

    cleanAddress(addr?: string): string {
        if (!addr) return '-';
        return addr
            .replace(/<br\s*\/?>/gi, ', ')
            .replace(/\r/g, '')
            .replace(/\n+/g, ', ')
            .replace(/\s*,\s*,+/g, ', ')
            .trim();
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

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
            <div class="bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden">
                <!-- Cover Image with Gradient Overlay -->
                <div class="relative w-full h-60 sm:h-72 bg-surface-800 flex items-center justify-center overflow-hidden">
                    <img
                        [src]="b.imageUrl || 'https://klikindogrosir.com/web_images/dummy_images/placeholder_banner.png'"
                        [alt]="b.name"
                        class="w-full h-full object-cover"
                        (error)="onImageError($event)"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-surface-950/85 via-surface-950/40 to-transparent"></div>

                    <!-- Floating Badges in Top-Left Corner -->
                    <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
                        <span class="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-surface-900/80 backdrop-blur-md text-white border border-white/20 shadow-md">
                            Kode IGR: {{ b.code }}
                        </span>
                        <p-tag [value]="b.isActive ? 'Aktif' : 'Nonaktif'" [severity]="b.isActive ? 'success' : 'warn'" class="text-xs shadow-md" />
                    </div>

                    <!-- Overlay Header Info at Bottom -->
                    <div class="absolute bottom-0 left-0 right-0 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div class="flex flex-col">
                            <h2 class="m-0 font-bold text-2xl sm:text-3xl text-white drop-shadow-sm">
                                {{ b.name }}
                            </h2>
                            <div class="flex items-center gap-2 mt-1.5 text-xs text-white/80">
                                <i class="pi pi-map-marker text-emerald-400"></i>
                                <span>{{ b.city || '-' }}</span>
                                <span>•</span>
                                <span>Kepulauan: <strong class="text-white">{{ b.rawMetadata?.island_name || '-' }}</strong></span>
                            </div>
                        </div>

                        <!-- Direct Maps Action CTA -->
                        <div *ngIf="b.latitude && b.longitude" class="shrink-0">
                            <a
                                [href]="'https://www.google.com/maps/search/?api=1&query=' + b.latitude + ',' + b.longitude"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-surface-100 text-surface-900 font-bold text-xs shadow-md transition-all cursor-pointer"
                            >
                                <i class="pi pi-compass text-primary text-sm"></i>
                                <span>Buka di Google Maps</span>
                                <i class="pi pi-arrow-up-right text-[10px] text-muted-color"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 3 Symmetrical Metric / Detail Cards -->
                <div class="p-6 bg-surface-0 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Card 1: Alamat Fisik -->
                        <div class="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-primary">
                                    <i class="pi pi-map-marker text-sm"></i>
                                    <span>Alamat Fisik Gerai</span>
                                </div>
                                <p class="text-xs text-surface-800 dark:text-surface-200 m-0 leading-relaxed font-medium">
                                    {{ cleanAddress(b.address) }}
                                </p>
                            </div>
                            <div class="mt-4 pt-2 border-t border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between text-[11px] text-muted-color">
                                <span>Kota</span>
                                <span class="font-semibold text-surface-800 dark:text-surface-200">{{ b.city || '-' }}</span>
                            </div>
                        </div>

                        <!-- Card 2: Kontak & Telepon -->
                        <div class="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-500">
                                    <i class="pi pi-phone text-sm"></i>
                                    <span>Kontak Operasional</span>
                                </div>
                                <div class="flex flex-col gap-1.5 mt-2">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-muted-color">Telepon:</span>
                                        <span class="font-mono font-bold text-surface-900 dark:text-surface-0">{{ b.phone || '-' }}</span>
                                    </div>
                                    <div *ngIf="b.rawMetadata?.fax" class="flex items-center justify-between text-xs">
                                        <span class="text-muted-color">Fax:</span>
                                        <span class="font-mono text-surface-700 dark:text-surface-300">{{ b.rawMetadata.fax }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 pt-2 border-t border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between text-[11px] text-muted-color">
                                <span>Layanan</span>
                                <span class="text-emerald-500 font-semibold">Toko & Gudang Wholesale</span>
                            </div>
                        </div>

                        <!-- Card 3: Geolocation & Koordinat -->
                        <div class="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-500">
                                    <i class="pi pi-globe text-sm"></i>
                                    <span>Geolokasi GPS</span>
                                </div>
                                <div class="flex flex-col gap-1.5 mt-2">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-muted-color">Lintang (Lat):</span>
                                        <span class="font-mono text-surface-800 dark:text-surface-200">{{ b.latitude || '-' }}</span>
                                    </div>
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-muted-color">Bujur (Lng):</span>
                                        <span class="font-mono text-surface-800 dark:text-surface-200">{{ b.longitude || '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 pt-2 border-t border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between text-[11px] text-muted-color">
                                <span>Kepulauan</span>
                                <span class="font-semibold text-surface-800 dark:text-surface-200">{{ b.rawMetadata?.island_name || 'INDONESIA' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Branch Linked Products Section -->
            <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm p-4">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h5 class="m-0 font-bold text-base text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <i class="pi pi-box text-primary"></i>
                            Katalog Produk Pemenuhan Cabang ({{ products().length }})
                        </h5>
                        <p class="text-xs text-muted-color mt-0.5 mb-0">
                            Produk yang terdaftar dan memiliki pemenuhan langsung dari gerai {{ b.name }}.
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

                <div *ngIf="products().length === 0" class="p-8 text-center text-muted-color bg-surface-50 dark:bg-surface-800/30 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
                    <i class="pi pi-inbox text-3xl mb-2"></i>
                    <p class="text-sm m-0">Belum ada produk yang disinkronkan untuk cabang ini.</p>
                </div>

                <div *ngIf="products().length > 0" class="flex flex-col gap-4">
                    <div *ngFor="let p of products()" class="p-4 rounded-xl border border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                                    <p-tag [value]="p.isAvailable ? 'Tersedia di Gerai' : 'Habis'" [severity]="p.isAvailable ? 'success' : 'danger'" class="text-xs" />
                                </div>
                                <span class="font-bold text-surface-900 dark:text-surface-0 text-base mt-0.5">{{ p.name }}</span>
                                <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-color">
                                    <span>Merk: <strong class="text-surface-700 dark:text-surface-300">{{ $any(p.brandId)?.name || p.brand || '-' }}</strong></span>
                                    <span>•</span>
                                    <span>Kategori: <strong class="text-surface-700 dark:text-surface-300">{{ $any(p.categoryId)?.name || p.category || '-' }}</strong></span>
                                </div>
                            </div>
                        </div>

                        <!-- Pricing Breakdown -->
                        <div class="flex flex-col items-start md:items-end">
                            <span class="text-xs text-muted-color">Harga Retail Gerai</span>
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

                    <!-- Pricing Tier Box -->
                    <div *ngIf="products()[0]?.pricingTiers as tiers" class="pt-2">
                        <span class="block font-semibold text-xs text-surface-700 dark:text-surface-300 mb-2">
                            Skema Harga Grosir Bertingkat di Cabang Ini:
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

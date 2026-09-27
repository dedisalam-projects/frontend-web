import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-12">
        <div class="card p-6 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <i class="pi pi-file-pdf text-2xl"></i>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0 tracking-tight m-0">Blip PDF Studio</h1>
              <p class="text-surface-600 dark:text-surface-400 text-sm mt-1 mb-0">High-fidelity 100.0% pixel-perfect document rendering & realtime management</p>
            </div>
          </div>
          <p class="text-surface-600 dark:text-surface-400 text-sm leading-relaxed max-w-3xl">
            Pilih menu <strong>Generate PDF</strong> di sebelah kiri untuk mengelola draft dokumen dan mencetak tiket/tanda terima secara presisi sub-pixel (Traveloka, Gojek, inDrive, dan Jackal Holidays).
          </p>
        </div>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <a routerLink="/generate-pdf/gojek" class="block no-underline">
          <div class="card p-5 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-colors shadow-sm cursor-pointer">
            <div class="flex items-center justify-between mb-3">
              <span class="text-surface-600 dark:text-surface-400 text-sm font-semibold">Gojek</span>
              <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 flex items-center justify-center">
                <i class="pi pi-car text-xl"></i>
              </div>
            </div>
            <div class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1">GoCar & GoRide</div>
            <span class="text-xs text-surface-500">5 varian layanan resmi</span>
          </div>
        </a>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <a routerLink="/generate-pdf/traveloka" class="block no-underline">
          <div class="card p-5 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-colors shadow-sm cursor-pointer">
            <div class="flex items-center justify-between mb-3">
              <span class="text-surface-600 dark:text-surface-400 text-sm font-semibold">Traveloka</span>
              <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <i class="pi pi-ticket text-xl"></i>
              </div>
            </div>
            <div class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1">Bus & Hotel</div>
            <span class="text-xs text-surface-500">Tiket Bus & Voucher Hotel</span>
          </div>
        </a>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <a routerLink="/generate-pdf/indrive" class="block no-underline">
          <div class="card p-5 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-colors shadow-sm cursor-pointer">
            <div class="flex items-center justify-between mb-3">
              <span class="text-surface-600 dark:text-surface-400 text-sm font-semibold">inDrive</span>
              <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <i class="pi pi-map text-xl"></i>
              </div>
            </div>
            <div class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1">Mobil & Motor</div>
            <span class="text-xs text-surface-500">Tanda terima perjalanan resmi</span>
          </div>
        </a>
      </div>

      <div class="col-span-12 md:col-span-6 lg:col-span-3">
        <a routerLink="/generate-pdf/jackal" class="block no-underline">
          <div class="card p-5 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-colors shadow-sm cursor-pointer">
            <div class="flex items-center justify-between mb-3">
              <span class="text-surface-600 dark:text-surface-400 text-sm font-semibold">Jackal Holidays</span>
              <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <i class="pi pi-compass text-xl"></i>
              </div>
            </div>
            <div class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-1">Luxury Shuttle</div>
            <span class="text-xs text-surface-500">E-Tiket resmi dengan QR Code</span>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class DashboardComponent {}

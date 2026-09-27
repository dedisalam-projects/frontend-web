import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DocumentService } from '../../services/document.service';
import { SocketService } from '../../services/socket.service';
import { DocumentFormDialogComponent } from './document-form-dialog.component';

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    DocumentFormDialogComponent,
  ],
  template: `
    <div class="card p-6 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
      <!-- TABLE HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ providerTitle }} Documents</h2>
          <p class="text-sm text-surface-600 dark:text-surface-400 mt-1 mb-0">Kelola draft dan cetak PDF dengan presisi pixel-perfect ground truth</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input
              pInputText
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="loadData()"
              placeholder="Cari dokumen..."
              class="w-full md:w-64"
            />
          </span>
          <p-button
            icon="pi pi-plus"
            label="Tambah Dokumen"
            severity="primary"
            (onClick)="openCreateDialog()"
          ></p-button>
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            severity="secondary"
            pTooltip="Refresh Data"
            (onClick)="loadData()"
          ></p-button>
        </div>
      </div>

      <!-- DATA TABLE -->
      <p-table
        [value]="documents()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="limit()"
        [totalRecords]="total()"
        [lazy]="true"
        (onPage)="onPageChange($event)"
        [rowsPerPageOptions]="[5, 10, 20]"
        tableStyleClass="min-w-full"
        class="p-datatable-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 60px">#</th>
            <!-- TRAVELOKA HEADERS -->
            @if (provider === 'traveloka') {
              <th>No. Bukti / PO</th>
              <th>Kategori</th>
              <th>Pelanggan</th>
              <th>Tanggal</th>
              <th>Total</th>
            }
            <!-- GOJEK HEADERS -->
            @if (provider === 'gojek') {
              <th>ID Pesanan</th>
              <th>Layanan</th>
              <th>Pelanggan / Driver</th>
              <th>Kendaraan</th>
              <th>Total Tarif</th>
            }
            <!-- INDRIVE HEADERS -->
            @if (provider === 'indrive') {
              <th>No. Invoice</th>
              <th>Layanan</th>
              <th>Penumpang / Pengemudi</th>
              <th>Tanggal</th>
              <th>Tarif</th>
            }
            <!-- JACKAL HEADERS -->
            @if (provider === 'jackal') {
              <th>Kode Booking</th>
              <th>Penumpang</th>
              <th>Rute & Jadwal</th>
              <th>Kursi</th>
              <th>Total Bayar</th>
            }
            <th style="width: 120px" class="text-center">Status</th>
            <th style="width: 180px" class="text-right">Aksi</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-doc let-i="rowIndex">
          <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
            <td>{{ (page() - 1) * limit() + i + 1 }}</td>

            <!-- TRAVELOKA CELLS -->
            @if (provider === 'traveloka') {
              <td>
                <span class="font-semibold block text-surface-900 dark:text-surface-0">{{ doc.receiptNo }}</span>
                <span class="text-xs text-surface-500">PO: {{ doc.poNumber }}</span>
              </td>
              <td>
                <span class="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded font-medium">{{ doc.category }}</span>
              </td>
              <td>
                <span class="block font-medium">{{ doc.customer?.name || '-' }}</span>
                <span class="text-xs text-surface-500">{{ doc.customer?.phone || '-' }}</span>
              </td>
              <td class="text-sm">{{ doc.transactionDate }}</td>
              <td class="font-semibold">{{ doc.totalAmount | currency:'IDR':'symbol':'1.0-0':'id-ID' }}</td>
            }

            <!-- GOJEK CELLS -->
            @if (provider === 'gojek') {
              <td>
                <span class="font-semibold block text-surface-900 dark:text-surface-0">{{ doc.orderId }}</span>
                <span class="text-xs text-surface-500">{{ doc.transactionDate }}</span>
              </td>
              <td>
                <span class="text-xs px-2 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded font-medium uppercase">{{ doc.serviceType }}</span>
              </td>
              <td>
                <span class="block font-medium">{{ doc.customerName }}</span>
                <span class="text-xs text-surface-500">Driver: {{ doc.driverName }}</span>
              </td>
              <td>
                <span class="block text-sm">{{ doc.vehicleType }}</span>
                <span class="text-xs font-mono text-surface-500">{{ doc.vehiclePlate }}</span>
              </td>
              <td class="font-semibold">{{ doc.totalPaid | currency:'IDR':'symbol':'1.0-0':'id-ID' }}</td>
            }

            <!-- INDRIVE CELLS -->
            @if (provider === 'indrive') {
              <td>
                <span class="font-semibold block text-surface-900 dark:text-surface-0">{{ doc.invoiceNumber }}</span>
                <span class="text-xs text-surface-500">{{ doc.distance }}</span>
              </td>
              <td>
                <span class="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-medium">{{ doc.serviceType }}</span>
              </td>
              <td>
                <span class="block font-medium">{{ doc.recipientName }}</span>
                <span class="text-xs text-surface-500">Driver: {{ doc.driverName }}</span>
              </td>
              <td class="text-sm">{{ doc.tripDate }}</td>
              <td class="font-semibold">{{ doc.fare | currency:'IDR':'symbol':'1.0-0':'id-ID' }}</td>
            }

            <!-- JACKAL CELLS -->
            @if (provider === 'jackal') {
              <td>
                <span class="font-semibold block text-surface-900 dark:text-surface-0">{{ doc.bookingCode }}</span>
                <span class="text-xs text-surface-500">{{ doc.bookingDate }}</span>
              </td>
              <td>
                <span class="block font-medium">{{ doc.customer?.name }}</span>
                <span class="text-xs text-surface-500">{{ doc.customer?.phone }}</span>
              </td>
              <td>
                <span class="block text-sm font-medium">{{ doc.departure?.point }}</span>
                <span class="text-xs text-surface-500">&rarr; {{ doc.destination?.point }}</span>
              </td>
              <td>
                <span class="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 rounded font-bold text-xs">{{ doc.passengers?.[0]?.seat || '-' }}</span>
              </td>
              <td class="font-semibold">{{ doc.payment?.totalPaid | currency:'IDR':'symbol':'1.0-0':'id-ID' }}</td>
            }

            <!-- STATUS BADGE (REALTIME) -->
            <td class="text-center">
              @if (doc.status === 'generated') {
                <p-tag value="Generated" severity="success" icon="pi pi-check"></p-tag>
              } @else {
                <p-tag value="Draft" severity="secondary" icon="pi pi-file"></p-tag>
              }
            </td>

            <!-- ACTION BUTTONS -->
            <td class="text-right">
              <div class="flex items-center justify-end gap-1">
                <p-button
                  icon="pi pi-print"
                  label="Generate"
                  severity="success"
                  size="small"
                  [loading]="generatingId() === doc._id"
                  (onClick)="generatePdf(doc)"
                  pTooltip="Cetak PDF Ground Truth ke Tab Baru"
                ></p-button>
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  severity="secondary"
                  size="small"
                  (onClick)="openEditDialog(doc)"
                  pTooltip="Edit Data"
                ></p-button>
                <p-button
                  icon="pi pi-trash"
                  [text]="true"
                  severity="danger"
                  size="small"
                  (onClick)="deleteDoc(doc)"
                  pTooltip="Hapus Draft"
                ></p-button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center p-8 text-surface-500">
              <div class="flex flex-col items-center justify-center gap-2">
                <i class="pi pi-inbox text-4xl text-surface-400"></i>
                <span class="font-medium">Belum ada dokumen untuk provider {{ providerTitle }}.</span>
                <p-button label="Tambah Dokumen Baru" icon="pi pi-plus" size="small" [text]="true" (onClick)="openCreateDialog()"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- FORM DIALOG -->
    <app-document-form-dialog
      [(visible)]="formDialogVisible"
      [provider]="provider"
      [editData]="selectedDoc"
      (saved)="onDocumentSaved($event)"
    ></app-document-form-dialog>
  `,
})
export class DocumentTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) provider = 'gojek';

  private documentService = inject(DocumentService);
  private socketService = inject(SocketService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  documents = signal<any[]>([]);
  total = signal<number>(0);
  page = signal<number>(1);
  limit = signal<number>(10);
  loading = signal<boolean>(false);
  generatingId = signal<string | null>(null);

  searchQuery = '';
  formDialogVisible = false;
  selectedDoc: any = null;

  get providerTitle(): string {
    const titles: Record<string, string> = {
      traveloka: 'Traveloka',
      gojek: 'Gojek',
      indrive: 'inDrive',
      jackal: 'Jackal Holidays',
    };
    return titles[this.provider] || this.provider;
  }

  ngOnInit() {
    this.initRealtimeSubscriptions();
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['provider'] && !changes['provider'].firstChange) {
      this.socketService.leaveProvider(changes['provider'].previousValue);
      this.socketService.joinProvider(this.provider);
      this.page.set(1);
      this.loadData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.leaveProvider(this.provider);
  }

  private initRealtimeSubscriptions() {
    this.socketService.joinProvider(this.provider);

    // Realtime: Document Created
    this.socketService
      .onCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.provider === this.provider && payload.data) {
          const exists = this.documents().some((d) => d._id === payload.data._id);
          if (!exists) {
            this.documents.update((list) => [payload.data, ...list]);
            this.total.update((t) => t + 1);
            this.messageService.add({
              severity: 'info',
              summary: 'Dokumen Baru',
              detail: `Dokumen baru ditambahkan secara realtime.`,
              life: 3000,
            });
          }
        }
      });

    // Realtime: Document Updated
    this.socketService
      .onUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.provider === this.provider && payload.data) {
          this.documents.update((list) =>
            list.map((d) => (d._id === payload.data._id ? payload.data : d)),
          );
        }
      });

    // Realtime: Document Deleted
    this.socketService
      .onDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.provider === this.provider && payload.id) {
          this.documents.update((list) => list.filter((d) => d._id !== payload.id));
          this.total.update((t) => Math.max(0, t - 1));
        }
      });

    // Realtime: Document Generated (Green Status Transition)
    this.socketService
      .onGenerated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload.provider === this.provider && payload.data) {
          this.documents.update((list) =>
            list.map((d) =>
              d._id === payload.data._id
                ? { ...d, status: 'generated', lastGeneratedAt: payload.data.lastGeneratedAt }
                : d,
            ),
          );
        }
      });
  }

  loadData() {
    this.loading.set(true);
    this.documentService
      .getDocuments(this.provider, {
        page: this.page(),
        limit: this.limit(),
        search: this.searchQuery,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.documents.set(res.data.items || []);
            this.total.set(res.data.total || 0);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Gagal Memuat Data',
            detail: err.message || 'Terjadi kesalahan saat memuat dokumen.',
          });
        },
      });
  }

  onPageChange(event: any) {
    const pageIndex = Math.floor(event.first / event.rows) + 1;
    this.page.set(pageIndex);
    this.limit.set(event.rows);
    this.loadData();
  }

  generatePdf(doc: any) {
    this.generatingId.set(doc._id);
    this.documentService.generatePdfBlob(this.provider, doc._id).subscribe({
      next: (blob) => {
        this.generatingId.set(null);
        if (isPlatformBrowser(this.platformId)) {
          const blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Berhasil Generate PDF',
          detail: 'Dokumen PDF 100% ground-truth dibuka di tab baru.',
          life: 4000,
        });
      },
      error: (err) => {
        this.generatingId.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Gagal Generate PDF',
          detail: err.message || 'Gagal menghasilkan PDF dari template.',
        });
      },
    });
  }

  openCreateDialog() {
    this.selectedDoc = null;
    this.formDialogVisible = true;
  }

  openEditDialog(doc: any) {
    this.selectedDoc = doc;
    this.formDialogVisible = true;
  }

  onDocumentSaved(payload: any) {
    if (this.selectedDoc?._id) {
      // Update
      this.documentService.updateDocument(this.provider, this.selectedDoc._id, payload).subscribe({
        next: () => {
          this.formDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Tersimpan',
            detail: 'Dokumen berhasil diperbarui.',
          });
          this.loadData();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Gagal Menyimpan',
            detail: err.message || 'Gagal menyimpan perubahan.',
          });
        },
      });
    } else {
      // Create
      this.documentService.createDocument(this.provider, payload).subscribe({
        next: () => {
          this.formDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Berhasil',
            detail: 'Dokumen baru berhasil dibuat.',
          });
          this.loadData();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Gagal Membuat',
            detail: err.message || 'Gagal membuat dokumen.',
          });
        },
      });
    }
  }

  deleteDoc(doc: any) {
    this.confirmationService.confirm({
      message: `Hapus dokumen ini secara permanen?`,
      header: 'Konfirmasi Hapus',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.documentService.deleteDocument(this.provider, doc._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Terhapus',
              detail: 'Dokumen telah dihapus.',
            });
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Gagal Menghapus',
              detail: err.message || 'Terjadi kesalahan saat menghapus.',
            });
          },
        });
      },
    });
  }
}

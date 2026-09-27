import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-document-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '680px', maxWidth: '95vw' }"
      [header]="isEdit ? 'Edit Dokumen ' + providerTitle : 'Tambah Dokumen ' + providerTitle"
      (onHide)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 pt-2">
        <!-- TRAVELOKA -->
        @if (provider === 'traveloka') {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Kategori</label>
              <p-select [options]="travelokaCategories" formControlName="category" class="w-full"></p-select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">No. Tanda Terima (receiptNo)</label>
              <input pInputText formControlName="receiptNo" class="w-full" placeholder="#1837161707445701177" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">No. Pesanan (poNumber)</label>
              <input pInputText formControlName="poNumber" class="w-full" placeholder="1268028452" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Waktu Transaksi</label>
              <input pInputText formControlName="transactionDate" class="w-full" placeholder="09 Jul 2025, 16:47 (Rabu)" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Metode Pembayaran</label>
              <input pInputText formControlName="paymentMethod" class="w-full" placeholder="GoPay / GoPay Tabungan" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Total Pembayaran (Rp)</label>
              <p-inputNumber formControlName="totalAmount" class="w-full" mode="currency" currency="IDR" locale="id-ID"></p-inputNumber>
            </div>
          </div>
          <div class="border-t border-surface-200 dark:border-surface-700 pt-3">
            <h4 class="text-sm font-semibold mb-2">Informasi Pemesan & Penumpang</h4>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-surface-600 mb-1">Nama Pemesan</label>
                <input pInputText formControlName="customerName" class="w-full" placeholder="Dedi Salam Permana" />
              </div>
              <div>
                <label class="block text-xs text-surface-600 mb-1">Email</label>
                <input pInputText formControlName="customerEmail" class="w-full" placeholder="dedis@example.com" />
              </div>
              <div>
                <label class="block text-xs text-surface-600 mb-1">No. HP</label>
                <input pInputText formControlName="customerPhone" class="w-full" placeholder="+6285856416338" />
              </div>
            </div>
          </div>
        }

        <!-- GOJEK -->
        @if (provider === 'gojek') {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Jenis Layanan</label>
              <p-select [options]="gojekServices" formControlName="serviceType" class="w-full"></p-select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">ID Pesanan (orderId)</label>
              <input pInputText formControlName="orderId" class="w-full" placeholder="RB-3255218-47103883" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Tanggal Transaksi</label>
              <input pInputText formControlName="transactionDate" class="w-full" placeholder="Rabu, 3 Desember 2025" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Nama Pelanggan</label>
              <input pInputText formControlName="customerName" class="w-full" placeholder="Dedi S. Permana" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nama Driver</label>
              <input pInputText formControlName="driverName" class="w-full" placeholder="Robby Asyatra" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Plat & Jenis Kendaraan</label>
              <div class="grid grid-cols-2 gap-2">
                <input pInputText formControlName="vehiclePlate" placeholder="D1481YCA" />
                <input pInputText formControlName="vehicleType" placeholder="Daihatsu Sigra" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-surface-600 mb-1">Jarak Tempuh</label>
              <input pInputText formControlName="distance" class="w-full" placeholder="39.1 km" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Durasi</label>
              <input pInputText formControlName="duration" class="w-full" placeholder="78 menit" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Total Pembayaran (Rp)</label>
              <p-inputNumber formControlName="totalPaid" class="w-full" mode="currency" currency="IDR" locale="id-ID"></p-inputNumber>
            </div>
          </div>
        }

        <!-- INDRIVE -->
        @if (provider === 'indrive') {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Layanan</label>
              <p-select [options]="indriveServices" formControlName="serviceType" class="w-full"></p-select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">No. Invoice (invoiceNumber)</label>
              <input pInputText formControlName="invoiceNumber" class="w-full" placeholder="ID260920215743a4CU" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nama Penumpang</label>
              <input pInputText formControlName="recipientName" class="w-full" placeholder="Dedi" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Nama Pengemudi</label>
              <input pInputText formControlName="driverName" class="w-full" placeholder="John Hariadi Sitepu" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Detail Kendaraan</label>
              <input pInputText formControlName="vehicleDetail" class="w-full" placeholder="Toyota Avanza Silver D1105AHA" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tanggal Perjalanan</label>
              <input pInputText formControlName="tripDate" class="w-full" placeholder="21 September 2026" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-surface-600 mb-1">Jarak (km)</label>
              <input pInputText formControlName="distance" class="w-full" placeholder="7.6 km" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Metode Bayar</label>
              <input pInputText formControlName="paymentMethod" class="w-full" placeholder="Tunai" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Tarif (Rp)</label>
              <p-inputNumber formControlName="fare" class="w-full" mode="currency" currency="IDR" locale="id-ID"></p-inputNumber>
            </div>
          </div>
        }

        <!-- JACKAL -->
        @if (provider === 'jackal') {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Kode Booking (bookingCode)</label>
              <input pInputText formControlName="bookingCode" class="w-full" placeholder="BJKL250721UDWZ" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Waktu Booking</label>
              <input pInputText formControlName="bookingDate" class="w-full" placeholder="21 Juli 2025 15:00" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nama Pemesan</label>
              <input pInputText formControlName="customerName" class="w-full" placeholder="DEDI SALAM PERMANA" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">No. HP & Email</label>
              <div class="grid grid-cols-2 gap-2">
                <input pInputText formControlName="customerPhone" placeholder="085856416338" />
                <input pInputText formControlName="customerEmail" placeholder="dedis@example.com" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Titik Keberangkatan</label>
              <input pInputText formControlName="departurePoint" class="w-full" placeholder="DIPATIUKUR 89 SEBRANG UNIKOM" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Titik Tujuan</label>
              <input pInputText formControlName="destinationPoint" class="w-full" placeholder="CENTRAL PARK (VIRTUAL POOL)" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-surface-600 mb-1">No. Kursi</label>
              <input pInputText formControlName="passengerSeat" class="w-full" placeholder="3" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Metode Bayar</label>
              <input pInputText formControlName="paymentMethod" class="w-full" placeholder="BCA VIRTUAL ACCOUNT" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Total Bayar (Rp)</label>
              <p-inputNumber formControlName="totalPaid" class="w-full" mode="currency" currency="IDR" locale="id-ID"></p-inputNumber>
            </div>
          </div>
        }

        <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
          <p-button label="Batal" severity="secondary" [text]="true" (onClick)="onClose()"></p-button>
          <p-button type="submit" [label]="isEdit ? 'Simpan Perubahan' : 'Buat Dokumen'" severity="primary" [loading]="submitting"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class DocumentFormDialogComponent implements OnInit {
  @Input() visible = false;
  @Input() provider = 'gojek';
  @Input() editData: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  form!: FormGroup;
  submitting = false;

  travelokaCategories = [
    { label: 'Tiket Bus & Shuttle', value: 'Tiket Bus & Shuttle' },
    { label: 'Hotel / Akomodasi', value: 'Hotel / Akomodasi' },
  ];

  gojekServices = [
    { label: 'GoCar', value: 'gocar' },
    { label: 'GoCar Hemat', value: 'gocar-hemat' },
    { label: 'GoRide', value: 'goride' },
    { label: 'GoRide Comfort', value: 'goride-comfort' },
    { label: 'GoRide Hemat', value: 'goride-hemat' },
  ];

  indriveServices = [
    { label: 'inDrive Mobil', value: 'indrive-mobil' },
    { label: 'inDrive Motor', value: 'indrive-motor' },
  ];

  get isEdit(): boolean {
    return !!this.editData?._id;
  }

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
    this.buildForm();
  }

  ngOnChanges() {
    this.buildForm();
  }

  private buildForm() {
    const d = this.editData || {};
    if (this.provider === 'traveloka') {
      this.form = this.fb.group({
        category: [d.category || 'Tiket Bus & Shuttle', Validators.required],
        receiptNo: [d.receiptNo || '', Validators.required],
        poNumber: [d.poNumber || '', Validators.required],
        transactionDate: [d.transactionDate || '', Validators.required],
        paymentMethod: [d.paymentMethod || 'GoPay / GoPay Tabungan', Validators.required],
        totalAmount: [d.totalAmount || 120000, Validators.required],
        customerName: [d.customer?.name || 'Dedi Salam Permana', Validators.required],
        customerEmail: [d.customer?.email || 'dedis@example.com'],
        customerPhone: [d.customer?.phone || '+6285856416338'],
      });
    } else if (this.provider === 'gojek') {
      this.form = this.fb.group({
        serviceType: [d.serviceType || 'gocar', Validators.required],
        orderId: [d.orderId || '', Validators.required],
        transactionDate: [d.transactionDate || 'Rabu, 3 Desember 2025', Validators.required],
        customerName: [d.customerName || 'Dedi S. Permana', Validators.required],
        driverName: [d.driverName || 'Robby Asyatra', Validators.required],
        vehiclePlate: [d.vehiclePlate || 'D1481YCA', Validators.required],
        vehicleType: [d.vehicleType || 'Daihatsu Sigra', Validators.required],
        distance: [d.distance || '39.1 km', Validators.required],
        duration: [d.duration || '78 menit', Validators.required],
        totalPaid: [d.totalPaid || 178000, Validators.required],
      });
    } else if (this.provider === 'indrive') {
      this.form = this.fb.group({
        serviceType: [d.serviceType || 'indrive-mobil', Validators.required],
        invoiceNumber: [d.invoiceNumber || '', Validators.required],
        recipientName: [d.recipientName || 'Dedi', Validators.required],
        driverName: [d.driverName || 'John Hariadi Sitepu', Validators.required],
        vehicleDetail: [d.vehicleDetail || 'Toyota Avanza Silver D1105AHA', Validators.required],
        tripDate: [d.tripDate || '21 September 2026', Validators.required],
        distance: [d.distance || '7.6 km', Validators.required],
        paymentMethod: [d.paymentMethod || 'Tunai', Validators.required],
        fare: [d.fare || 30000, Validators.required],
      });
    } else if (this.provider === 'jackal') {
      this.form = this.fb.group({
        bookingCode: [d.bookingCode || '', Validators.required],
        bookingDate: [d.bookingDate || '21 Juli 2025 15:00', Validators.required],
        customerName: [d.customer?.name || 'DEDI SALAM PERMANA', Validators.required],
        customerPhone: [d.customer?.phone || '085856416338', Validators.required],
        customerEmail: [d.customer?.email || 'dedis@example.com'],
        departurePoint: [d.departure?.point || 'DIPATIUKUR 89 SEBRANG UNIKOM', Validators.required],
        destinationPoint: [d.destination?.point || 'CENTRAL PARK (VIRTUAL POOL)', Validators.required],
        passengerSeat: [d.passengers?.[0]?.seat || '3', Validators.required],
        paymentMethod: [d.payment?.method || 'BCA VIRTUAL ACCOUNT', Validators.required],
        totalPaid: [d.payment?.totalPaid || 119900, Validators.required],
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    let payload: any = {};

    if (this.provider === 'traveloka') {
      payload = {
        category: val.category,
        receiptNo: val.receiptNo,
        poNumber: val.poNumber,
        transactionDate: val.transactionDate,
        paymentMethod: val.paymentMethod,
        paymentStatus: 'Lunas',
        totalAmount: val.totalAmount,
        customer: {
          name: val.customerName,
          email: val.customerEmail,
          phone: val.customerPhone,
        },
        passengerName: val.customerName,
        items: [
          {
            itemNo: 1,
            itemType: val.category === 'Hotel / Akomodasi' ? 'Akomodasi' : 'Tiket Bus',
            descriptionLines: ['Rute Perjalanan Standar'],
            quantity: 1,
            unitPrice: val.totalAmount,
            totalPrice: val.totalAmount,
            rowHeight: 83.25,
          },
        ],
      };
    } else if (this.provider === 'gojek') {
      payload = {
        serviceType: val.serviceType,
        orderId: val.orderId,
        transactionDate: val.transactionDate,
        customerName: val.customerName,
        driverName: val.driverName,
        vehiclePlate: val.vehiclePlate,
        vehicleType: val.vehicleType,
        distance: val.distance,
        duration: val.duration,
        pickup: {
          date: val.transactionDate,
          time: '09:43',
          placeName: 'Lokasi Penjemputan',
          address: 'Jl. Penjemputan No. 1, Kota Bandung',
        },
        destination: {
          date: val.transactionDate,
          time: '11:02',
          placeName: 'Lokasi Tujuan',
          address: 'Jl. Tujuan No. 100, Kota Bandung',
        },
        paymentRows: [{ item: 'Biaya perjalanan', amount: val.totalPaid }],
        totalPaid: val.totalPaid,
      };
    } else if (this.provider === 'indrive') {
      payload = {
        serviceType: val.serviceType,
        invoiceNumber: val.invoiceNumber,
        recipientName: val.recipientName,
        driverName: val.driverName,
        vehicleDetail: val.vehicleDetail,
        tripDate: val.tripDate,
        invoiceDate: val.tripDate,
        pickup: { location: 'Bandung, Jawa Barat', time: '05:07 WIB' },
        dropoff: { location: 'Stasiun Bandung', time: '05:23 WIB' },
        distance: val.distance,
        paymentMethod: val.paymentMethod,
        fare: val.fare,
      };
    } else if (this.provider === 'jackal') {
      payload = {
        serviceType: 'jackal-shuttle',
        bookingCode: val.bookingCode,
        bookingDate: val.bookingDate,
        customer: {
          name: val.customerName,
          phone: val.customerPhone,
          email: val.customerEmail,
          address: '-',
        },
        departure: {
          point: val.departurePoint,
          address: val.departurePoint,
          date: 'Selasa, 22 Juli 2025',
          time: '05:15',
        },
        destination: {
          point: val.destinationPoint,
          address: val.destinationPoint,
        },
        passengers: [
          {
            name: val.customerName,
            seat: val.passengerSeat,
            route: 'DU - CP',
            schedule: '05:15',
          },
        ],
        payment: {
          totalPrice: val.totalPaid,
          totalPaid: val.totalPaid,
          method: val.paymentMethod,
          time: val.bookingDate,
        },
      };
    }

    this.saved.emit(payload);
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

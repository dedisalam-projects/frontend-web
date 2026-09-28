import { Component, EventEmitter, Input, Output, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const INDO_FULL_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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
    DatePickerModule,
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
              <p-datepicker
                formControlName="transactionDate"
                [showTime]="true"
                hourFormat="24"
                [showIcon]="true"
                class="w-full"
                placeholder="Pilih tanggal & waktu"
              ></p-datepicker>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Metode Pembayaran</label>
              <p-select
                [options]="travelokaPaymentMethods"
                [editable]="true"
                formControlName="paymentMethod"
                class="w-full"
                placeholder="Pilih atau ketik metode bayar"
              ></p-select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Total Pembayaran</label>
              <p-inputnumber
                formControlName="totalAmount"
                class="w-full"
                mode="currency"
                currency="IDR"
                locale="id-ID"
              ></p-inputnumber>
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
              <p-datepicker
                formControlName="transactionDate"
                [showTime]="true"
                hourFormat="24"
                [showIcon]="true"
                class="w-full"
                placeholder="Pilih tanggal & waktu"
              ></p-datepicker>
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
              <label class="block text-xs text-surface-600 mb-1">Total Pembayaran</label>
              <p-inputnumber
                formControlName="totalPaid"
                class="w-full"
                mode="currency"
                currency="IDR"
                locale="id-ID"
              ></p-inputnumber>
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
              <p-datepicker
                formControlName="tripDate"
                [showTime]="false"
                [showIcon]="true"
                class="w-full"
                placeholder="Pilih tanggal perjalanan"
              ></p-datepicker>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-surface-600 mb-1">Jarak (km)</label>
              <input pInputText formControlName="distance" class="w-full" placeholder="7.6 km" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Metode Bayar</label>
              <p-select
                [options]="indrivePaymentMethods"
                [editable]="true"
                formControlName="paymentMethod"
                class="w-full"
                placeholder="Pilih metode bayar"
              ></p-select>
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Tarif</label>
              <p-inputnumber
                formControlName="fare"
                class="w-full"
                mode="currency"
                currency="IDR"
                locale="id-ID"
              ></p-inputnumber>
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
              <p-datepicker
                formControlName="bookingDate"
                [showTime]="true"
                hourFormat="24"
                [showIcon]="true"
                class="w-full"
                placeholder="Pilih tanggal & waktu booking"
              ></p-datepicker>
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
              <p-select
                [options]="jackalPools"
                [editable]="true"
                formControlName="departurePoint"
                class="w-full"
                placeholder="Pilih atau ketik pool keberangkatan"
              ></p-select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Titik Tujuan</label>
              <p-select
                [options]="jackalPools"
                [editable]="true"
                formControlName="destinationPoint"
                class="w-full"
                placeholder="Pilih atau ketik pool tujuan"
              ></p-select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-surface-600 mb-1">No. Kursi</label>
              <input pInputText formControlName="passengerSeat" class="w-full" placeholder="3" />
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Metode Bayar</label>
              <p-select
                [options]="jackalPaymentMethods"
                [editable]="true"
                formControlName="paymentMethod"
                class="w-full"
                placeholder="Pilih metode bayar"
              ></p-select>
            </div>
            <div>
              <label class="block text-xs text-surface-600 mb-1">Total Bayar</label>
              <p-inputnumber
                formControlName="totalPaid"
                class="w-full"
                mode="currency"
                currency="IDR"
                locale="id-ID"
              ></p-inputnumber>
            </div>
          </div>
        }

        <div class="flex justify-between items-center gap-2 mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
          <p-button label="Batal" severity="secondary" [text]="true" (onClick)="onClose()"></p-button>
          <div class="flex items-center gap-2">
            <p-button
              type="button"
              [label]="isEdit ? 'Simpan Perubahan' : 'Simpan Draft'"
              severity="secondary"
              [outlined]="true"
              [loading]="submitting"
              (onClick)="submitForm(false)"
            ></p-button>
            <p-button
              type="button"
              [label]="isEdit ? 'Simpan & Generate PDF' : 'Generate PDF'"
              icon="pi pi-print"
              severity="success"
              [loading]="submitting"
              (onClick)="submitForm(true)"
            ></p-button>
          </div>
        </div>
      </form>
    </p-dialog>
  `,
})
export class DocumentFormDialogComponent implements OnInit, OnChanges {
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

  travelokaPaymentMethods = [
    { label: 'GoPay / GoPay Tabungan', value: 'GoPay / GoPay Tabungan' },
    { label: 'BCA Virtual Account', value: 'BCA Virtual Account' },
    { label: 'Mandiri Virtual Account', value: 'Mandiri Virtual Account' },
    { label: 'Kartu Kredit / Debit', value: 'Kartu Kredit / Debit' },
    { label: 'Traveloka PayLater', value: 'Traveloka PayLater' },
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

  indrivePaymentMethods = [
    { label: 'Tunai', value: 'Tunai' },
    { label: 'OVO', value: 'OVO' },
    { label: 'GoPay', value: 'GoPay' },
    { label: 'Kartu Kredit / Debit', value: 'Kartu Kredit / Debit' },
  ];

  jackalPaymentMethods = [
    { label: 'BCA VIRTUAL ACCOUNT', value: 'BCA VIRTUAL ACCOUNT' },
    { label: 'MANDIRI VIRTUAL ACCOUNT', value: 'MANDIRI VIRTUAL ACCOUNT' },
    { label: 'BRI VIRTUAL ACCOUNT', value: 'BRI VIRTUAL ACCOUNT' },
    { label: 'QRIS', value: 'QRIS' },
    { label: 'TUNAI POOL', value: 'TUNAI POOL' },
  ];

  jackalPools = [
    { label: 'DIPATIUKUR 89 SEBRANG UNIKOM', value: 'DIPATIUKUR 89 SEBRANG UNIKOM' },
    { label: 'CENTRAL PARK (VIRTUAL POOL)', value: 'CENTRAL PARK (VIRTUAL POOL)' },
    { label: 'PASTEUR 28 BANDUNG', value: 'PASTEUR 28 BANDUNG' },
    { label: 'BLOK M PLAZA JAKARTA', value: 'BLOK M PLAZA JAKARTA' },
    { label: 'BANDARA SOEKARNO HATTA (TERMINAL 3)', value: 'BANDARA SOEKARNO HATTA (TERMINAL 3)' },
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

  private parseDateFromProvider(dateVal: any): Date {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === 'string') {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) return parsed;

      // Extract parts using Indonesian regex
      // Matches e.g. "09 Jul 2025, 16:47" or "Selasa, 23 September 2025 jam 19:16" or "21 Juli 2025 15:00"
      const dayMatch = dateVal.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10);
        const monthStr = dayMatch[2].toLowerCase();
        const year = parseInt(dayMatch[3], 10);

        let monthIdx = INDO_FULL_MONTHS.findIndex(m => m.toLowerCase() === monthStr);
        if (monthIdx === -1) {
          monthIdx = INDO_SHORT_MONTHS.findIndex(m => m.toLowerCase() === monthStr);
        }
        if (monthIdx !== -1) {
          let hours = 9;
          let minutes = 0;
          const timeMatch = dateVal.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
          }
          return new Date(year, monthIdx, day, hours, minutes);
        }
      }
    }
    return new Date();
  }

  private formatDateForProvider(dateObj: Date, provider: string): string {
    const d = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
    const dayName = INDO_DAYS[d.getDay()];
    const day = d.getDate();
    const dayPadded = String(day).padStart(2, '0');
    const monthShort = INDO_SHORT_MONTHS[d.getMonth()];
    const monthFull = INDO_FULL_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    switch (provider) {
      case 'traveloka':
        // Format: 09 Jul 2025, 16:47 (Rabu)
        return `${dayPadded} ${monthShort} ${year}, ${hours}:${minutes} (${dayName})`;
      case 'gojek':
        // Format: Selasa, 23 September 2025 jam 19:16
        return `${dayName}, ${day} ${monthFull} ${year} jam ${hours}:${minutes}`;
      case 'indrive':
        // Format: 21 September 2026
        return `${day} ${monthFull} ${year}`;
      case 'jackal':
        // Format: 21 Juli 2025 15:00
        return `${day} ${monthFull} ${year} ${hours}:${minutes}`;
      default:
        return d.toISOString();
    }
  }

  private buildForm() {
    const d = this.editData || {};
    const shortTs = Math.floor(Date.now() / 1000);

    if (this.provider === 'traveloka') {
      this.form = this.fb.group({
        category: [d.category || 'Tiket Bus & Shuttle', Validators.required],
        receiptNo: [d.receiptNo || `#183716${shortTs}`, Validators.required],
        poNumber: [d.poNumber || `126${shortTs}`, Validators.required],
        transactionDate: [this.parseDateFromProvider(d.transactionDate), Validators.required],
        paymentMethod: [d.paymentMethod || 'GoPay / GoPay Tabungan', Validators.required],
        totalAmount: [d.totalAmount !== undefined ? d.totalAmount : 120000, [Validators.required, Validators.min(0)]],
        customerName: [d.customer?.name || 'Dedi Salam Permana', Validators.required],
        customerEmail: [d.customer?.email || 'dedis@example.com'],
        customerPhone: [d.customer?.phone || '+6285856416338'],
      });
    } else if (this.provider === 'gojek') {
      this.form = this.fb.group({
        serviceType: [d.serviceType || 'gocar', Validators.required],
        orderId: [d.orderId || `RB-${shortTs}-47103883`, Validators.required],
        transactionDate: [this.parseDateFromProvider(d.transactionDate), Validators.required],
        customerName: [d.customerName || 'Hai Dedi S. Permana', Validators.required],
        driverName: [d.driverName || 'Robby Asyatra', Validators.required],
        vehiclePlate: [d.vehiclePlate || 'D1481YCA', Validators.required],
        vehicleType: [d.vehicleType || 'Daihatsu Sigra', Validators.required],
        distance: [d.distance || '39.1 km', Validators.required],
        duration: [d.duration || '78 menit', Validators.required],
        totalPaid: [d.totalPaid !== undefined ? d.totalPaid : 178000, [Validators.required, Validators.min(0)]],
      });
    } else if (this.provider === 'indrive') {
      this.form = this.fb.group({
        serviceType: [d.serviceType || 'indrive-mobil', Validators.required],
        invoiceNumber: [d.invoiceNumber || `ID${shortTs}a4CU`, Validators.required],
        recipientName: [d.recipientName || 'Dedi', Validators.required],
        driverName: [d.driverName || 'John Hariadi Sitepu', Validators.required],
        vehicleDetail: [d.vehicleDetail || 'Toyota Avanza Silver D1105AHA', Validators.required],
        tripDate: [this.parseDateFromProvider(d.tripDate), Validators.required],
        distance: [d.distance || '7.6 km', Validators.required],
        paymentMethod: [d.paymentMethod || 'Tunai', Validators.required],
        fare: [d.fare !== undefined ? d.fare : 30000, [Validators.required, Validators.min(0)]],
      });
    } else if (this.provider === 'jackal') {
      this.form = this.fb.group({
        bookingCode: [d.bookingCode || `BJKL${shortTs}`, Validators.required],
        bookingDate: [this.parseDateFromProvider(d.bookingDate), Validators.required],
        customerName: [d.customer?.name || 'DEDI SALAM PERMANA', Validators.required],
        customerPhone: [d.customer?.phone || '085856416338', Validators.required],
        customerEmail: [d.customer?.email || 'dedis@example.com'],
        departurePoint: [d.departure?.point || 'DIPATIUKUR 89 SEBRANG UNIKOM', Validators.required],
        destinationPoint: [d.destination?.point || 'CENTRAL PARK (VIRTUAL POOL)', Validators.required],
        passengerSeat: [d.passengers?.[0]?.seat || '3', Validators.required],
        paymentMethod: [d.payment?.method || 'BCA VIRTUAL ACCOUNT', Validators.required],
        totalPaid: [d.payment?.totalPaid !== undefined ? d.payment.totalPaid : 119900, [Validators.required, Validators.min(0)]],
      });
    }
  }

  onSubmit() {
    this.submitForm(true);
  }

  submitForm(generateImmediately: boolean = false) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    let payload: any = {};

    if (this.provider === 'traveloka') {
      const formattedDate = this.formatDateForProvider(val.transactionDate, 'traveloka');
      payload = {
        category: val.category,
        receiptNo: val.receiptNo,
        poNumber: val.poNumber,
        transactionDate: formattedDate,
        paymentMethod: val.paymentMethod,
        paymentStatus: 'Lunas',
        totalAmount: Number(val.totalAmount),
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
            unitPrice: Number(val.totalAmount),
            totalPrice: Number(val.totalAmount),
            rowHeight: 83.25,
          },
        ],
      };
    } else if (this.provider === 'gojek') {
      const formattedDate = this.formatDateForProvider(val.transactionDate, 'gojek');
      const timeStr = val.transactionDate instanceof Date 
        ? `${String(val.transactionDate.getHours()).padStart(2, '0')}:${String(val.transactionDate.getMinutes()).padStart(2, '0')}`
        : '09:43';
      payload = {
        serviceType: val.serviceType,
        orderId: val.orderId,
        transactionDate: formattedDate,
        customerName: val.customerName,
        driverName: val.driverName,
        vehiclePlate: val.vehiclePlate,
        vehicleType: val.vehicleType,
        distance: val.distance,
        duration: val.duration,
        pickup: {
          date: formattedDate,
          time: timeStr,
          placeName: 'Lokasi Penjemputan',
          address: 'Jl. Penjemputan No. 1, Kota Bandung',
        },
        destination: {
          date: formattedDate,
          time: '11:02',
          placeName: 'Lokasi Tujuan',
          address: 'Jl. Tujuan No. 100, Kota Bandung',
        },
        paymentRows: [{ item: 'Biaya perjalanan', amount: Number(val.totalPaid) }],
        totalPaid: Number(val.totalPaid),
      };
    } else if (this.provider === 'indrive') {
      const formattedDate = this.formatDateForProvider(val.tripDate, 'indrive');
      payload = {
        serviceType: val.serviceType,
        invoiceNumber: val.invoiceNumber,
        recipientName: val.recipientName,
        driverName: val.driverName,
        vehicleDetail: val.vehicleDetail,
        tripDate: formattedDate,
        invoiceDate: formattedDate,
        pickup: { location: 'Bandung, Jawa Barat', time: '05:07 WIB' },
        dropoff: { location: 'Stasiun Bandung', time: '05:23 WIB' },
        distance: val.distance,
        paymentMethod: val.paymentMethod,
        fare: Number(val.fare),
      };
    } else if (this.provider === 'jackal') {
      const formattedDate = this.formatDateForProvider(val.bookingDate, 'jackal');
      const timeStr = val.bookingDate instanceof Date 
        ? `${String(val.bookingDate.getHours()).padStart(2, '0')}:${String(val.bookingDate.getMinutes()).padStart(2, '0')}`
        : '05:15';
      payload = {
        serviceType: 'jackal-shuttle',
        bookingCode: val.bookingCode,
        bookingDate: formattedDate,
        customer: {
          name: val.customerName,
          phone: val.customerPhone,
          email: val.customerEmail,
          address: '-',
        },
        departure: {
          point: val.departurePoint,
          address: val.departurePoint,
          date: formattedDate,
          time: timeStr,
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
            schedule: timeStr,
          },
        ],
        payment: {
          totalPrice: Number(val.totalPaid),
          totalPaid: Number(val.totalPaid),
          method: val.paymentMethod,
          time: formattedDate,
        },
      };
    }

    this.saved.emit({ payload, generateImmediately });
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

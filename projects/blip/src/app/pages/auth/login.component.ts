import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4 transition-colors">
      <div class="w-full max-w-md">
        <!-- BRAND LOGO & TITLE -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 text-green-600 mb-4 shadow-sm">
            <i class="pi pi-file-pdf text-3xl"></i>
          </div>
          <h1 class="text-3xl font-extrabold text-surface-900 dark:text-surface-0 tracking-tight mb-2">
            BLIP STUDIO
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-sm">
            Masuk untuk mengakses sistem pembuatan & cetak dokumen pixel-perfect
          </p>
        </div>

        <!-- LOGIN CARD -->
        <div class="card p-8 rounded-3xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl">
          <form (ngSubmit)="onLogin()" class="flex flex-col gap-5">
            <div>
              <label for="email" class="block text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
                Alamat Email
              </label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-envelope"></i>
                <input
                  pInputText
                  id="email"
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  placeholder="admin@dedisalam.my.id"
                  class="w-full"
                  required
                />
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="password" class="block text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Kata Sandi
                </label>
              </div>
              <p-password
                inputId="password"
                name="password"
                [(ngModel)]="password"
                placeholder="••••••••"
                [toggleMask]="true"
                [feedback]="false"
                class="w-full"
                [fluid]="true"
                required
              ></p-password>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <p-checkbox [(ngModel)]="rememberMe" name="rememberMe" [binary]="true" inputId="remember"></p-checkbox>
                <label for="remember" class="text-xs text-surface-600 dark:text-surface-400 cursor-pointer">
                  Ingat Saya
                </label>
              </div>
              <span class="text-xs text-primary-600 dark:text-primary-400 font-medium cursor-pointer">
                Lupa Sandi?
              </span>
            </div>

            <p-button
              type="submit"
              label="Masuk ke Blip Studio"
              icon="pi pi-sign-in"
              severity="success"
              styleClass="w-full font-bold py-3"
              [loading]="loading"
            ></p-button>

            <!-- DEMO ACCOUNT QUICK FILL -->
            <div class="pt-4 border-t border-surface-200 dark:border-surface-800 text-center">
              <p class="text-xs text-surface-500 mb-2">Kredensial Resmi Akun Terverifikasi:</p>
              <button
                type="button"
                (click)="fillDemoCredentials()"
                class="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 hover:bg-surface-200 transition-colors cursor-pointer border-0"
              >
                <i class="pi pi-user-check text-green-500"></i>
                admin&#64;dedisalam.my.id (Demo Superadmin)
              </button>
            </div>
          </form>
        </div>

        <!-- FOOTER -->
        <p class="text-center text-xs text-surface-500 dark:text-surface-400 mt-6">
          &copy; 2026 Blip PDF Studio &bull; High Fidelity Ground Truth Engine
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  email = 'admin@dedisalam.my.id';
  password = 'Password123!';
  rememberMe = true;
  loading = false;
  returnUrl = '/';

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // If already authenticated, redirect immediately
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  fillDemoCredentials() {
    this.email = 'admin@dedisalam.my.id';
    this.password = 'Password123!';
    this.messageService.add({
      severity: 'info',
      summary: 'Kredensial Terisi',
      detail: 'Akun terverifikasi admin@dedisalam.my.id siap digunakan.',
      life: 2500,
    });
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Tidak Lengkap',
        detail: 'Harap masukkan email dan kata sandi.',
      });
      return;
    }

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Login Berhasil',
            detail: `Selamat datang kembali, ${res.data?.user?.name || this.email}!`,
            life: 2000,
          });
          setTimeout(() => {
            this.router.navigateByUrl(this.returnUrl);
          }, 500);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Gagal',
            detail: res.message || 'Kredensial tidak valid.',
          });
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Gagal terhubung ke API Gateway authentication.';
        this.messageService.add({
          severity: 'error',
          summary: 'Autentikasi Gagal',
          detail: msg,
        });
      },
    });
  }
}

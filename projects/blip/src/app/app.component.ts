import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast></p-toast>
    <p-confirmdialog></p-confirmdialog>
    <router-outlet></router-outlet>
  `,

})
export class AppComponent {}

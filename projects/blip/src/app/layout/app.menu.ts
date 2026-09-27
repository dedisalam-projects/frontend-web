import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    @for (item of model; track item.label) {
      @if (!item.separator) {
        <li app-menuitem [item]="item" [root]="true"></li>
      } @else {
        <li class="menu-separator"></li>
      }
    }
  </ul>`,
})
export class AppMenu implements OnInit {
  model: MenuItem[] = [];

  ngOnInit() {
    this.model = [
      {
        label: 'Menu Utama',
        items: [
          { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
        ],
      },
      {
        label: 'Generate PDF',
        items: [
          { label: 'Gojek', icon: 'pi pi-fw pi-car', routerLink: ['/generate-pdf/gojek'] },
          { label: 'Traveloka', icon: 'pi pi-fw pi-ticket', routerLink: ['/generate-pdf/traveloka'] },
          { label: 'inDrive', icon: 'pi pi-fw pi-map', routerLink: ['/generate-pdf/indrive'] },
          { label: 'Jackal Holidays', icon: 'pi pi-fw pi-compass', routerLink: ['/generate-pdf/jackal'] },
        ],
      },
    ];
  }
}

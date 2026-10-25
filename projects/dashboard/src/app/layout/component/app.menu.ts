import { Component } from '@angular/core';
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
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Menu Utama',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Manajemen User', icon: 'pi pi-fw pi-users', routerLink: ['/users'] }
                ]
            },
            {
                label: 'KlikIndogrosir',
                items: [
                    { label: 'Rekapitulasi', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/indogrosir'] },
                    { label: 'Produk', icon: 'pi pi-fw pi-box', routerLink: ['/products'] },
                    { label: 'Cabang', icon: 'pi pi-fw pi-map-marker', routerLink: ['/branches'] },
                    { label: 'Kategori', icon: 'pi pi-fw pi-tags', routerLink: ['/categories'] },
                    { label: 'Brand / Merek', icon: 'pi pi-fw pi-bookmark', routerLink: ['/brands'] }
                ]
            }
        ];
    }
}

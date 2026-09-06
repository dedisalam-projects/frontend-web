import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { User, UserService } from '@/app/pages/service/user.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToolbarModule,
        InputTextModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <!-- Reserved for future actions like 'New User' -->
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="users()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'email', 'role']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            [loading]="loading"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">User Management</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="name" style="min-width:16rem">
                        Name
                        <p-sorticon field="name" />
                    </th>
                    <th pSortableColumn="email" style="min-width:16rem">
                        Email
                        <p-sorticon field="email" />
                    </th>
                    <th pSortableColumn="role" style="min-width:10rem">
                        Role
                        <p-sorticon field="role" />
                    </th>
                    <th pSortableColumn="isActive" style="min-width: 12rem">
                        Status
                        <p-sorticon field="isActive" />
                    </th>
                </tr>
            </ng-template>
            <ng-template #body let-user>
                <tr>
                    <td style="min-width: 16rem">{{ user.name }}</td>
                    <td style="min-width: 16rem">{{ user.email }}</td>
                    <td>
                        <p-tag [value]="user.role | uppercase" [severity]="getRoleSeverity(user.role)" />
                    </td>
                    <td>
                        <p-tag [value]="user.isActive ? 'ACTIVE' : 'INACTIVE'" [severity]="user.isActive ? 'success' : 'danger'" />
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="4">No users found.</td>
                </tr>
            </ng-template>
        </p-table>
    `
})
export class Users implements OnInit {
    users = signal<User[]>([]);
    loading: boolean = true;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private userService: UserService,
        private messageService: MessageService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadUsers();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'role', header: 'Role' },
            { field: 'isActive', header: 'Status' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadUsers() {
        this.loading = true;
        this.userService.getUsers().then((data) => {
            const list = Array.isArray(data) ? data : ((data as any)?.data && Array.isArray((data as any).data)) ? (data as any).data : [];
            this.users.set(list);
            this.loading = false;
        }).catch(err => {
            this.loading = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load users. You might not have the required permissions.',
                life: 5000
            });
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getRoleSeverity(role: string) {
        switch (role?.toLowerCase()) {
            case 'super_admin':
            case 'admin':
                return 'info';
            case 'user':
            default:
                return 'secondary';
        }
    }
}

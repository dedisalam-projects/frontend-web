import { Component, OnInit, OnDestroy, signal, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { User, UserService } from '../service/user.service';
import { environment } from '../../../environments/environment';

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
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, PasswordModule, SelectModule, DialogModule, ConfirmDialogModule, TagModule, InputIconModule, IconFieldModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Delete" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsers()" [disabled]="!selectedUsers || !selectedUsers.length" />
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
            [(selection)]="selectedUsers"
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
                    <th style="width: 3rem">
                        <p-tableheadercheckbox />
                    </th>
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
                    <th style="min-width: 12rem">Action</th>
                </tr>
            </ng-template>
            <ng-template #body let-user>
                <tr>
                    <td style="width: 3rem">
                        <p-tablecheckbox [value]="user" />
                    </td>
                    <td style="min-width: 16rem">{{ user.name }}</td>
                    <td style="min-width: 16rem">{{ user.email }}</td>
                    <td>
                        <p-tag [value]="user.role | uppercase" [severity]="getRoleSeverity(user.role)" />
                    </td>
                    <td>
                        <p-tag [value]="user.isActive ? 'ACTIVE' : 'INACTIVE'" [severity]="user.isActive ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUser(user)" ariaLabel="Edit user" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUser(user)" ariaLabel="Delete user" />
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="6">No users found.</td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '450px' }" [header]="dialogTitle" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Name</label>
                        <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !user.name">Name is required.</small>
                    </div>
                    <div>
                        <label for="email" class="block font-bold mb-3">Email</label>
                        <input type="email" pInputText id="email" [(ngModel)]="user.email" required fluid />
                        <small class="text-red-500" *ngIf="submitted && !user.email">Email is required.</small>
                    </div>
                    <div *ngIf="isNewUser">
                        <label for="password" class="block font-bold mb-3">Password</label>
                        <p-password id="password" [(ngModel)]="userPassword" [toggleMask]="true" [feedback]="false" fluid placeholder="Min. 8 characters" />
                        <small class="text-red-500" *ngIf="submitted && isNewUser && (!userPassword || userPassword.length < 8)">Password is required (min 8 chars).</small>
                    </div>
                    <div>
                        <label for="role" class="block font-bold mb-3">Role</label>
                        <p-select [(ngModel)]="user.role" inputId="role" [options]="roles" optionLabel="label" optionValue="value" placeholder="Select a Role" fluid />
                    </div>
                    <div>
                        <label for="status" class="block font-bold mb-3">Status</label>
                        <p-select [(ngModel)]="user.isActive" inputId="status" [options]="statuses" optionLabel="label" optionValue="value" placeholder="Select Status" fluid />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveUser()" [loading]="saving" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `
})
export class Users implements OnInit, OnDestroy {
    users = signal<User[]>([]);
    loading: boolean = true;
    saving: boolean = false;
    socket: Socket | null = null;

    userDialog: boolean = false;
    submitted: boolean = false;
    isNewUser: boolean = false;
    dialogTitle: string = 'User Details';

    user: User = {};
    userPassword: string = '';
    selectedUsers: User[] | null = null;

    roles = [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Guest', value: 'guest' }
    ];

    statuses = [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    private platformId = inject(PLATFORM_ID);

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.loadUsers();
            this.initRealtimeSync();
        }

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'role', header: 'Role' },
            { field: 'isActive', header: 'Status' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadUsers() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        this.loading = true;
        this.userService
            .getUsers()
            .then((data) => {
                const list = Array.isArray(data) ? data : (data as any)?.data && Array.isArray((data as any).data) ? (data as any).data : [];
                this.users.set(list);
                this.loading = false;
            })
            .catch((err) => {
                this.loading = false;
                console.warn('Could not load remote users:', err);
            });
    }

    openNew() {
        this.user = {
            role: 'user',
            isActive: true
        };
        this.userPassword = '';
        this.isNewUser = true;
        this.dialogTitle = 'New User';
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: User) {
        this.user = { ...user };
        this.userPassword = '';
        this.isNewUser = false;
        this.dialogTitle = 'Edit User';
        this.submitted = false;
        this.userDialog = true;
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete user <b>${user.name || user.email}</b>?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                const currentUsers = this.users();
                await this.userService.deleteUser(user.id || '');
                this.users.set(currentUsers.filter((val) => val.id !== user.id));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: `User ${user.name || ''} deleted`,
                    life: 3000
                });
            }
        });
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected users?',
            header: 'Confirm Delete Selected',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                if (!this.selectedUsers?.length) return;
                const idsToDelete = this.selectedUsers.map((u) => u.id || '');
                await this.userService.deleteUsers(idsToDelete);
                this.users.set(this.users().filter((val) => !idsToDelete.includes(val.id || '')));
                this.selectedUsers = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Selected users deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
        this.saving = false;
    }

    async saveUser() {
        this.submitted = true;

        if (!this.user.name?.trim() || !this.user.email?.trim()) {
            return;
        }

        if (this.isNewUser && (!this.userPassword || this.userPassword.length < 8)) {
            return;
        }

        this.saving = true;

        if (this.isNewUser) {
            try {
                const created = await this.userService.createUser({
                    name: this.user.name.trim(),
                    email: this.user.email.trim(),
                    password: this.userPassword,
                    role: this.user.role || 'user',
                    isActive: this.user.isActive !== undefined ? this.user.isActive : true
                });

                this.users.update((current) => [created, ...current]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: `User ${created.name} created`,
                    life: 3000
                });
                this.userDialog = false;
            } catch (err) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create user.',
                    life: 4000
                });
            } finally {
                this.saving = false;
            }
        } else {
            // Update existing user
            try {
                const updated = await this.userService.updateUser(this.user.id || '', {
                    name: this.user.name.trim(),
                    email: this.user.email.trim(),
                    role: this.user.role,
                    isActive: this.user.isActive
                });

                this.users.update((current) => current.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));

                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: `User ${this.user.name} updated`,
                    life: 3000
                });
                this.userDialog = false;
            } catch (err) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update user.',
                    life: 4000
                });
            } finally {
                this.saving = false;
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getRoleSeverity(role: string | undefined): 'info' | 'warn' | 'danger' | 'secondary' | 'success' | 'contrast' {
        switch (role?.toLowerCase()) {
            case 'super_admin':
            case 'admin':
                return 'info';
            case 'guest':
                return 'warn';
            case 'user':
            default:
                return 'secondary';
        }
    }

    private initRealtimeSync() {
        if (!isPlatformBrowser(this.platformId)) return;
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        try {
            this.socket = io(`${environment.socketUrl}/notifications`, {
                transports: ['websocket', 'polling'],
                auth: { token }
            });

            this.socket.on('user_deleted', (data: { userId: string; timestamp?: string }) => {
                const deletedId = data?.userId;
                if (deletedId) {
                    this.users.update((list) => list.filter((u) => u.id !== deletedId && (u as any)._id !== deletedId));
                }
            });

            this.socket.on('user:deleted', (data: { userId: string }) => {
                const deletedId = data?.userId;
                if (deletedId) {
                    this.users.update((list) => list.filter((u) => u.id !== deletedId && (u as any)._id !== deletedId));
                }
            });

            this.socket.on('user_created', (data: any) => {
                const newUser = data?.user;
                if (newUser && (newUser.id || newUser._id)) {
                    const mapped: User = {
                        id: newUser.id || newUser._id,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role,
                        isActive: newUser.isActive !== undefined ? newUser.isActive : true,
                        createdAt: newUser.createdAt || new Date().toISOString()
                    };
                    this.users.update((current) => {
                        if (current.some((u) => u.id === mapped.id)) return current;
                        return [mapped, ...current];
                    });
                }
            });

            this.socket.on('user_updated', (data: any) => {
                const userId = data?.userId;
                const changes = data?.changes;
                if (userId && changes) {
                    this.users.update((current) => current.map((u) => (u.id === userId || (u as any)._id === userId ? { ...u, ...changes } : u)));
                }
            });
        } catch (err) {
            console.warn('Realtime Socket.IO initialization error:', err);
        }
    }

    ngOnDestroy() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

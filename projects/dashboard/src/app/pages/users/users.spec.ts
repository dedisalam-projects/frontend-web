import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PLATFORM_ID } from '@angular/core';
import { Users } from './users';
import { UserService, User } from '../service/user.service';

const socketEventHandlers: Record<string, Function> = {};
const mockSocketDisconnect = vi.fn();

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({
        on: vi.fn((event: string, handler: Function) => {
            socketEventHandlers[event] = handler;
        }),
        disconnect: mockSocketDisconnect,
        emit: vi.fn()
    }))
}));

describe('Users CRUD Component', () => {
    let component: Users;
    let fixture: ComponentFixture<Users>;
    let userService: UserService;
    let messageService: MessageService;
    let confirmationService: ConfirmationService;

    const mockUsers: User[] = [
        { id: 'usr-1', name: 'Admin', email: 'admin@test.com', role: 'admin', isActive: true },
        { id: 'usr-2', name: 'User Two', email: 'user2@test.com', role: 'user', isActive: false }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Users],
            providers: [provideHttpClient(), provideHttpClientTesting(), providePrimeNG({ theme: { preset: Aura } }), { provide: PLATFORM_ID, useValue: 'browser' }, MessageService, ConfirmationService, UserService]
        }).compileComponents();

        userService = TestBed.inject(UserService);
        vi.spyOn(userService, 'getUsers').mockResolvedValue([...mockUsers]);

        fixture = TestBed.createComponent(Users);
        component = fixture.componentInstance;
        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        messageService = fixture.debugElement.injector.get(MessageService);
        fixture.detectChanges();
    });

    it('should create Users component and initialize columns', () => {
        expect(component).toBeTruthy();
        expect(component.cols.length).toBe(4);
        expect(component.exportColumns.length).toBe(4);
    });

    it('should load users on init in browser platform', async () => {
        await fixture.whenStable();
        expect(component.users().length).toBe(2);
        expect(component.loading).toBe(false);
    });

    it('should open new user dialog with openNew', () => {
        component.openNew();
        expect(component.isNewUser).toBe(true);
        expect(component.dialogTitle).toBe('New User');
        expect(component.userDialog).toBe(true);
        expect(component.user.role).toBe('user');
        expect(component.user.isActive).toBe(true);
    });

    it('should open edit user dialog with editUser', () => {
        const userToEdit = mockUsers[0];
        component.editUser(userToEdit);
        expect(component.isNewUser).toBe(false);
        expect(component.dialogTitle).toBe('Edit User');
        expect(component.userDialog).toBe(true);
        expect(component.user.id).toBe('usr-1');
    });

    it('should hide dialog with hideDialog', () => {
        component.userDialog = true;
        component.hideDialog();
        expect(component.userDialog).toBe(false);
        expect(component.submitted).toBe(false);
        expect(component.saving).toBe(false);
    });

    it('should reject saveUser if name or email is empty', async () => {
        component.user = { name: '', email: '' };
        await component.saveUser();
        expect(component.submitted).toBe(true);
        expect(component.saving).toBe(false);
    });

    it('should reject new user if password is less than 8 characters', async () => {
        component.openNew();
        component.user = { name: 'Newbie', email: 'newbie@test.com' };
        component.userPassword = 'short';
        await component.saveUser();
        expect(component.saving).toBe(false);
    });

    it('should save a valid new user and update users signal', async () => {
        const createdUser: User = { id: 'usr-3', name: 'New User', email: 'new@test.com', role: 'user', isActive: true };
        vi.spyOn(userService, 'createUser').mockResolvedValue(createdUser);

        component.openNew();
        component.user = { name: 'New User', email: 'new@test.com', role: 'user', isActive: true };
        component.userPassword = 'ValidPassword123!';

        await component.saveUser();

        expect(component.users()[0].id).toBe('usr-3');
        expect(component.userDialog).toBe(false);
        expect(component.saving).toBe(false);
    });

    it('should save an edited user and update users signal', async () => {
        component.users.set([...mockUsers]);
        const updatedUser: User = { id: 'usr-1', name: 'Updated Admin', email: 'admin@test.com', role: 'admin', isActive: true };
        vi.spyOn(userService, 'updateUser').mockResolvedValue(updatedUser);

        component.editUser(mockUsers[0]);
        component.user.name = 'Updated Admin';

        await component.saveUser();

        expect(component.users().find((u) => u.id === 'usr-1')?.name).toBe('Updated Admin');
        expect(component.userDialog).toBe(false);
    });

    it('should handle error when loadUsers promise rejects', async () => {
        vi.spyOn(userService, 'getUsers').mockRejectedValue(new Error('Network error'));
        component.loadUsers();
        await new Promise((r) => setTimeout(r, 20));
        expect(component.loading).toBe(false);
    });

    it('should handle error when createUser fails in saveUser', async () => {
        const messageService = fixture.debugElement.injector.get(MessageService);
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(userService, 'createUser').mockRejectedValue(new Error('Backend error'));

        component.openNew();
        component.user.name = 'Failed User';
        component.user.email = 'failed@test.com';
        component.userPassword = 'validpassword123';

        await component.saveUser();

        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Error'
            })
        );
        expect(component.saving).toBe(false);
    });

    it('should handle error when updateUser fails in saveUser', async () => {
        const messageService = fixture.debugElement.injector.get(MessageService);
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(userService, 'updateUser').mockRejectedValue(new Error('Backend error'));

        component.editUser(mockUsers[0]);
        component.user.name = 'Failed Update';

        await component.saveUser();

        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'error',
                summary: 'Error'
            })
        );
        expect(component.saving).toBe(false);
    });

    it('should delete user upon confirmation and show toast to acting user', async () => {
        component.users.set([...mockUsers]);
        const messageService = fixture.debugElement.injector.get(MessageService);
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(userService, 'deleteUser').mockResolvedValue(true);

        let acceptCallback: (() => Promise<void>) | undefined;
        vi.spyOn(confirmationService, 'confirm').mockImplementation((opts: any) => {
            acceptCallback = opts.accept;
            return confirmationService;
        });

        component.deleteUser(mockUsers[0]);
        await acceptCallback!();

        expect(component.users().length).toBe(1);
        expect(component.users()[0].id).toBe('usr-2');
        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Successful'
            })
        );
    });

    it('should delete selected users upon confirmation and show toast to acting user', async () => {
        component.users.set([...mockUsers]);
        component.selectedUsers = [mockUsers[0], mockUsers[1]];
        const messageService = fixture.debugElement.injector.get(MessageService);
        const toastSpy = vi.spyOn(messageService, 'add');
        vi.spyOn(userService, 'deleteUsers').mockResolvedValue(true);

        let acceptCallback: (() => Promise<void>) | undefined;
        vi.spyOn(confirmationService, 'confirm').mockImplementation((opts: any) => {
            acceptCallback = opts.accept;
            return confirmationService;
        });

        component.deleteSelectedUsers();
        await acceptCallback!();

        expect(component.users().length).toBe(0);
        expect(component.selectedUsers).toBeNull();
        expect(toastSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Successful'
            })
        );
    });

    it('should export CSV via dt reference', () => {
        const exportSpy = vi.fn();
        component.dt = { exportCSV: exportSpy } as any;
        component.exportCSV();
        expect(exportSpy).toHaveBeenCalled();
    });

    it('should filter globally on table filter event', () => {
        const filterSpy = vi.fn();
        const mockTable = { filterGlobal: filterSpy } as any;
        const mockEvent = { target: { value: 'search-query' } } as unknown as Event;

        component.onGlobalFilter(mockTable, mockEvent);
        expect(filterSpy).toHaveBeenCalledWith('search-query', 'contains');
    });

    it('should return correct severity tag for roles', () => {
        expect(component.getRoleSeverity('admin')).toBe('info');
        expect(component.getRoleSeverity('super_admin')).toBe('info');
        expect(component.getRoleSeverity('guest')).toBe('warn');
        expect(component.getRoleSeverity('user')).toBe('secondary');
        expect(component.getRoleSeverity('unknown')).toBe('secondary');
    });

    it('should remove user when user_deleted realtime socket event is received without showing sync toast', () => {
        expect(component.users().length).toBe(2);
        const toastSpy = vi.spyOn(messageService, 'add');

        socketEventHandlers['user_deleted']?.({ userId: 'usr-1', timestamp: new Date().toISOString() });

        expect(component.users().length).toBe(1);
        expect(component.users()[0].id).toBe('usr-2');
        expect(toastSpy).not.toHaveBeenCalled();
    });

    it('should remove user when user:deleted realtime socket event is received', () => {
        expect(component.users().length).toBe(2);
        socketEventHandlers['user:deleted']?.({ userId: 'usr-2' });
        expect(component.users().length).toBe(1);
        expect(component.users()[0].id).toBe('usr-1');
    });

    it('should append user when user_created realtime socket event is received without showing sync toast', () => {
        expect(component.users().length).toBe(2);
        const toastSpy = vi.spyOn(messageService, 'add');

        socketEventHandlers['user_created']?.({
            user: { id: 'usr-new', name: 'Realtime User', email: 'rt@test.com', role: 'user', isActive: true },
            timestamp: new Date().toISOString()
        });

        expect(component.users().length).toBe(3);
        expect(component.users()[0].id).toBe('usr-new');
        expect(toastSpy).not.toHaveBeenCalled();
    });

    it('should update user fields when user_updated realtime socket event is received', () => {
        socketEventHandlers['user_updated']?.({
            userId: 'usr-1',
            changes: { name: 'Admin Updated', role: 'super_admin' },
            timestamp: new Date().toISOString()
        });

        const updated = component.users().find((u) => u.id === 'usr-1');
        expect(updated?.name).toBe('Admin Updated');
        expect(updated?.role).toBe('super_admin');
    });

    it('should remove user when user:deleted realtime event is received with { event, data } envelope', () => {
        expect(component.users().length).toBe(2);
        socketEventHandlers['user:deleted']?.({
            event: 'USER_DELETED',
            data: { userId: 'usr-2' }
        });
        expect(component.users().length).toBe(1);
        expect(component.users()[0].id).toBe('usr-1');
    });

    it('should append user when user:created realtime event is received with { event, data } envelope', () => {
        expect(component.users().length).toBe(2);
        socketEventHandlers['user:created']?.({
            event: 'USER_CREATED',
            data: { id: 'usr-envelope', name: 'Envelope User', email: 'env@test.com', role: 'user', isActive: true }
        });
        expect(component.users().length).toBe(3);
        expect(component.users()[0].id).toBe('usr-envelope');
    });

    it('should update user when user:updated realtime event is received with { event, data } envelope', () => {
        socketEventHandlers['user:updated']?.({
            event: 'USER_UPDATED',
            data: { id: 'usr-1', name: 'Envelope Updated Name' }
        });
        const updated = component.users().find((u) => u.id === 'usr-1');
        expect(updated?.name).toBe('Envelope Updated Name');
    });

    it('should disconnect socket on ngOnDestroy', () => {
        component.ngOnDestroy();
        expect(mockSocketDisconnect).toHaveBeenCalled();
        expect(component.socket).toBeNull();
    });
});

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseListComponent } from '../../../../shared/classes/base-list.component';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../../../shared/components/modal/modal.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { UserDialogComponent } from '../user-dialog/user-dialog';
import { UsersService } from '../users.service';
import { User, Role } from '../users.models';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent, FormsModule, RouterLink],
    templateUrl: './user-list.html'
})
export class UserListComponent extends BaseListComponent<User> implements OnInit {
    allUsers: User[] = [];

    columns: TableColumn[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Rol' }
    ];

    private usersService = inject(UsersService);
    private modalService = inject(ModalService);
    // dialog is inherited from BaseListComponent but we are overriding its usage or ignoring it.
    // Ideally BaseListComponent should also be migrated if it uses dialog.
    // Checking BaseListComponent later. 

    override ngOnInit() {
        super.ngOnInit();
    }

    override loadData() {
        this.isLoading = true;
        this.usersService.getUsers().subscribe({
            next: (data) => {
                this.allUsers = data;
                this.applyPagination();
                this.isLoading = false;
            },
            error: (err) => this.handleError(err)
        });
    }

    applyPagination() {
        // 1. Filter
        let filtered = this.allUsers;
        if (this.searchQuery) {
            const term = this.searchQuery.toLowerCase();
            filtered = this.allUsers.filter(user =>
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                this.getRoleLabel(user.role).toLowerCase().includes(term)
            );
        }

        // 2. Set Stats
        this.totalItems = filtered.length;

        // 3. Paginate
        const startIndex = (this.page - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.data = filtered.slice(startIndex, endIndex);
    }

    // Override filter change to use local filtering instead of backend
    override onSearch(query: string) {
        this.searchQuery = query;
        this.page = 1;
        this.applyPagination();
    }

    override onPageChange(page: number) {
        this.page = page;
        this.applyPagination();
    }

    override onPageSizeChange(size: number) {
        this.pageSize = size;
        this.page = 1; // Reset to first page
        this.applyPagination();
    }

    openDialog(user?: User) {
        const modalRef = this.modalService.open(UserDialogComponent, {
            data: { user },
            width: '500px',
            panelClass: ['custom-dialog-container']
        });

        modalRef.afterClosed().subscribe((result: any) => {
            if (result) this.loadData();
        });
    }

    deleteUser(user: User) {
        const modalRef = this.modalService.open(ConfirmationDialogComponent, {
            data: {
                title: 'Eliminar Usuario',
                message: `¿Estás seguro de que deseas eliminar al usuario ${user.name}? Esta acción no se puede deshacer.`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                color: 'warn'
            } as ConfirmationDialogData
        });

        // ModalRef.afterClosed() returns Observable
        modalRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.usersService.delete(user.id).subscribe({
                    next: () => {
                        this.notificationService.showSuccess('Usuario eliminado correctamente');
                        this.loadData();
                    },
                    error: (err) => {
                        if (err.status === 400 && err.error?.message) {
                            this.notificationService.showError(err.error.message);
                        } else {
                            this.handleError(err);
                        }
                    }
                });
            }
        });
    }

    getRoleLabel(role: Role): string {
        const labels: Record<string, string> = {
            [Role.ADMIN]: 'Administrador',
            [Role.ODONTOLOGO]: 'Odontólogo',
            [Role.RECEPCION]: 'Recepcionista'
        };
        return labels[role] || role;
    }
}

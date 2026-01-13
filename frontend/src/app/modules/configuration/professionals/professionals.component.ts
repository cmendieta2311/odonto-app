import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../admin/users/users.service';
import { User, Role } from '../../admin/users/users.models';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';
import { UserDialogComponent } from '../../admin/users/user-dialog/user-dialog';
import { ModalService } from '../../../shared/components/modal/modal.service';

@Component({
    selector: 'app-professionals',
    standalone: true,
    imports: [CommonModule, CustomTableComponent, FormsModule],
    templateUrl: './professionals.html'
})
export class ProfessionalsComponent implements OnInit {
    users: User[] = [];
    searchTerm = '';
    isLoading = false;

    columns: TableColumn[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' }
        // Hidden Role column as it's implicit
    ];

    private usersService = inject(UsersService);
    private modalService = inject(ModalService);

    ngOnInit() {
        this.loadUsers();
    }

    get filteredUsers() {
        if (!this.searchTerm) return this.users;
        const term = this.searchTerm.toLowerCase();
        return this.users.filter(user =>
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
        );
    }

    loadUsers() {
        this.isLoading = true;
        this.usersService.getUsers(Role.ODONTOLOGO).subscribe({
            next: (data) => {
                this.users = data;
                this.isLoading = false;
            },
            error: () => this.isLoading = false
        });
    }

    openDialog(user?: User) {
        const modalRef = this.modalService.open(UserDialogComponent, {
            data: {
                user: user,
                fixedRole: Role.ODONTOLOGO
            },
            width: '500px',
            panelClass: ['custom-dialog-container']
        });

        // If create mode, we might want to enforce/pass role, but UserDialog handles it.
        // Ideally we pass a "fixedRole" or "defaultRole" to UserDialog to ensure it's set correctly.
        // For now relying on UserDialog default.

        modalRef.afterClosed().subscribe((result: any) => {
            if (result) this.loadUsers();
        });
    }

    deleteUser(user: User) {
        if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
            this.usersService.delete(user.id).subscribe(() => this.loadUsers());
        }
    }
}

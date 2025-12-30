import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsersService } from '../users.service';
import { User, Role } from '../users.models';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table';
import { UserDialogComponent } from '../user-dialog/user-dialog';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, CustomTableComponent, MatDialogModule, FormsModule],
    templateUrl: './user-list.html'
})
export class UserListComponent implements OnInit {
    users: User[] = [];
    searchTerm = '';

    columns: TableColumn[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Rol' }
    ];

    private usersService = inject(UsersService);
    private dialog = inject(MatDialog);

    ngOnInit() {
        this.loadUsers();
    }

    get filteredUsers() {
        if (!this.searchTerm) return this.users;
        const term = this.searchTerm.toLowerCase();
        return this.users.filter(user =>
            user.name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            this.getRoleLabel(user.role).toLowerCase().includes(term)
        );
    }

    loadUsers() {
        this.usersService.getUsers().subscribe(data => this.users = data);
    }

    openDialog(user?: User) {
        const dialogRef = this.dialog.open(UserDialogComponent, {
            data: { user },
            width: '500px',
            panelClass: ['custom-dialog-container'] // global style needed or remove
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadUsers();
        });
    }

    deleteUser(user: User) {
        if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
            this.usersService.delete(user.id).subscribe(() => this.loadUsers());
        }
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

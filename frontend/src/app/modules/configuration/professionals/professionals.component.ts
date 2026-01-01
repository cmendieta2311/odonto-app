import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsersService } from '../../admin/users/users.service';
import { User, Role } from '../../admin/users/users.models';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';
import { UserDialogComponent } from '../../admin/users/user-dialog/user-dialog';

@Component({
    selector: 'app-professionals',
    standalone: true,
    imports: [CommonModule, CustomTableComponent, MatDialogModule, FormsModule],
    templateUrl: './professionals.html'
})
export class ProfessionalsComponent implements OnInit {
    users: User[] = [];
    searchTerm = '';

    columns: TableColumn[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' }
        // Hidden Role column as it's implicit
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
            user.email.toLowerCase().includes(term)
        );
    }

    loadUsers() {
        this.usersService.getUsers(Role.ODONTOLOGO).subscribe(data => this.users = data);
    }

    openDialog(user?: User) {
        const dialogRef = this.dialog.open(UserDialogComponent, {
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

        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadUsers();
        });
    }

    deleteUser(user: User) {
        if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
            this.usersService.delete(user.id).subscribe(() => this.loadUsers());
        }
    }
}

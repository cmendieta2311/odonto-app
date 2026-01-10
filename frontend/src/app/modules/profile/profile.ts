import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../admin/users/users.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
    infoForm: FormGroup;
    passwordForm: FormGroup;

    isUpdatingInfo = false;
    isUpdatingPass = false;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private usersService = inject(UsersService);
    private notificationService = inject(NotificationService);

    currentUser: any = null;

    constructor() {
        this.infoForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });

        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        const password = g.get('password')?.value;
        const confirmPassword = g.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { mismatch: true };
    }

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        const user = this.authService.currentUser();
        if (user && user.email) {
            this.currentUser = user;
            this.infoForm.patchValue({
                name: user.name,
                email: user.email
            });
        } else {
            // Fetch if not available
            this.authService.getProfile().subscribe(user => {
                this.currentUser = user;
                this.infoForm.patchValue({
                    name: user.name,
                    email: user.email
                });
            });
        }
    }

    updateInfo() {
        if (this.infoForm.invalid || !this.currentUser) return;
        this.isUpdatingInfo = true;

        const dto = { name: this.infoForm.get('name')?.value };

        this.usersService.update(this.currentUser.id, dto).subscribe({
            next: (updated) => {
                this.isUpdatingInfo = false;
                // Update local state if needed via AuthService
                this.notificationService.showSuccess('Información actualizada correctamente');
            },
            error: (err) => {
                console.error(err);
                this.isUpdatingInfo = false;
                this.notificationService.showError('Error al actualizar la información');
            }
        });
    }

    updatePassword() {
        if (this.passwordForm.invalid || !this.currentUser) return;
        this.isUpdatingPass = true;

        const dto = { password: this.passwordForm.get('password')?.value };

        this.usersService.update(this.currentUser.id, dto).subscribe({
            next: () => {
                this.isUpdatingPass = false;
                this.passwordForm.reset();
                this.notificationService.showSuccess('Contraseña actualizada correctamente');
            },
            error: (err) => {
                console.error(err);
                this.isUpdatingPass = false;
                this.notificationService.showError('Error al actualizar la contraseña');
            }
        });
    }
}

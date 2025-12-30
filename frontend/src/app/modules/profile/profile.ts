import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../admin/users/users.service';

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

    currentUser: any = null;

    constructor() {
        this.infoForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });

        this.passwordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
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
                alert('Información actualizada');
            },
            error: (err) => {
                console.error(err);
                this.isUpdatingInfo = false;
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
                alert('Contraseña actualizada');
            },
            error: (err) => {
                console.error(err);
                this.isUpdatingPass = false;
            }
        });
    }
}

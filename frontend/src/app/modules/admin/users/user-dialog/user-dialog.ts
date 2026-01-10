import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UsersService } from '../users.service';
import { User, Role } from '../users.models';

@Component({
    selector: 'app-user-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
    templateUrl: './user-dialog.html'
})
export class UserDialogComponent {
    form: FormGroup;
    isSaving = false;

    private fb = inject(FormBuilder);
    private usersService = inject(UsersService);

    constructor(
        public dialogRef: MatDialogRef<UserDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { user?: User; fixedRole?: Role }
    ) {
        this.form = this.fb.group({
            name: [data.user?.name || '', Validators.required],
            email: [data.user?.email || '', [Validators.required, Validators.email]],
            role: [{ value: data.fixedRole || data.user?.role || Role.ODONTOLOGO, disabled: !!data.fixedRole }, Validators.required],
            password: ['', data.user ? [] : [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['']
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');

        // Only validate if password is dirty or touched (or creating new user)
        if (!password || !confirmPassword) return null;

        if (password.value !== confirmPassword.value && (password.dirty || password.touched || confirmPassword.dirty || confirmPassword.touched)) {
            confirmPassword.setErrors({ mismatch: true });
            return { mismatch: true };
        } else {
            // Clear mismatch error if it was the only one
            if (confirmPassword.hasError('mismatch')) {
                confirmPassword.setErrors(null);
            }
        }
        return null;
    }

    save() {
        if (this.form.invalid) return;

        this.isSaving = true;
        const formValue = this.form.getRawValue();

        // Remove confirmPassword from DTO
        delete formValue.confirmPassword;

        if (this.data.user) {
            // Update
            const updateDto: any = { ...formValue };
            if (!updateDto.password) delete updateDto.password;

            this.usersService.update(this.data.user.id, updateDto).subscribe({
                next: () => this.dialogRef.close(true),
                error: (err) => {
                    console.error(err);
                    this.isSaving = false;
                }
            });
        } else {
            // Create
            this.usersService.create(formValue).subscribe({
                next: () => this.dialogRef.close(true),
                error: (err) => {
                    console.error(err);
                    this.isSaving = false;
                }
            });
        }
    }

    close() {
        this.dialogRef.close();
    }
}

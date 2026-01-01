import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
            password: ['', data.user ? [] : [Validators.required, Validators.minLength(6)]]
        });
    }

    save() {
        if (this.form.invalid) return;

        this.isSaving = true;
        const formValue = this.form.getRawValue(); // Use getRawValue() to include disabled fields

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

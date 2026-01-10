import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { PaymentMethod, PaymentType } from '../payment-methods.service';

@Component({
    selector: 'app-payment-method-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
    templateUrl: './payment-method-dialog.component.html'
})
export class PaymentMethodDialogComponent {
    form: FormGroup;
    types = Object.values(PaymentType);

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PaymentMethod | undefined
    ) {
        this.form = this.fb.group({
            name: [data?.name || '', Validators.required],
            code: [data?.code || PaymentType.OTHER, Validators.required],
            isCash: [data?.isCash ?? false],
            requiresReference: [data?.requiresReference ?? false],
            isActive: [data?.isActive ?? true]
        });
    }

    save() {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }

    cancel() {
        this.dialogRef.close();
    }
}

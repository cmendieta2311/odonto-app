import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { PaymentMethod } from '../contracts.models';

@Component({
  selector: 'app-contract-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './contract-dialog.html',
  styleUrl: './contract-dialog.css'
})
export class ContractDialogComponent {
  fb = inject(FormBuilder);
  paymentMethods = Object.values(PaymentMethod);

  form = this.fb.group({
    paymentMethod: [PaymentMethod.CASH, Validators.required],
    installments: [1]
  });

  showInstallments = false;

  constructor(
    public dialogRef: MatDialogRef<ContractDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { quoteId: string }
  ) {
    this.form.get('paymentMethod')?.valueChanges.subscribe(val => {
      this.showInstallments = val === PaymentMethod.CREDIT;
      if (this.showInstallments) {
        this.form.get('installments')?.setValidators([Validators.required, Validators.min(2)]);
      } else {
        this.form.get('installments')?.clearValidators();
        this.form.get('installments')?.setValue(1);
      }
      this.form.get('installments')?.updateValueAndValidity();
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close({
        quoteId: this.data.quoteId,
        ...this.form.value
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}

import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { PaymentMethod } from '../contracts.models';
import { PaymentsService } from '../payments.service';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.css'
})
export class PaymentDialogComponent {
  fb = inject(FormBuilder);
  paymentsService = inject(PaymentsService);
  paymentOpts = [
    { label: 'Efectivo', value: PaymentMethod.CASH },
    { label: 'Tarjeta', value: PaymentMethod.CREDIT_CARD },
    { label: 'Transferencia', value: PaymentMethod.TRANSFER }
  ];

  formattedAmount = '';
  isSaving = false;

  form = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: [PaymentMethod.CASH, Validators.required]
  });

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contractId: string; balance: number }
  ) {
    this.form.patchValue({ amount: data.balance });
    this.form.get('amount')?.addValidators(Validators.max(data.balance));
    this.formatAmount(data.balance.toString());
  }

  onAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formatAmount(input.value);
  }

  formatAmount(value: string) {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');

    if (!numericValue) {
      this.formattedAmount = '';
      this.form.patchValue({ amount: 0 });
      return;
    }

    const number = parseInt(numericValue, 10);
    this.formattedAmount = new Intl.NumberFormat('es-PY').format(number);
    this.form.patchValue({ amount: number });
  }

  save() {
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    const formValue = this.form.value;

    const dto = {
      contractId: this.data.contractId,
      amount: formValue.amount!,
      method: formValue.method!
    };

    this.paymentsService.createPayment(dto).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.dialogRef.close(res);
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        alert('Error al registrar el pago');
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}

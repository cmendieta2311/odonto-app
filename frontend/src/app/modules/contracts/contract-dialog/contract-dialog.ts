import { Component, Inject, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentMethod } from '../contracts.models';

@Component({
  selector: 'app-contract-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './contract-dialog.html',
  styleUrl: './contract-dialog.css'
})
export class ContractDialogComponent implements OnInit {
  fb = inject(FormBuilder);
  paymentMethods = Object.values(PaymentMethod);

  @Input() data: { quoteId: string } = { quoteId: '' };
  @Input() activeModal: any;

  form = this.fb.group({
    paymentMethod: [PaymentMethod.CASH, Validators.required],
    installments: [1]
  });

  showInstallments = false;

  ngOnInit() {
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
      this.activeModal.close({
        quoteId: this.data.quoteId,
        ...this.form.value
      });
    }
  }

  close() {
    this.activeModal.close();
  }
}

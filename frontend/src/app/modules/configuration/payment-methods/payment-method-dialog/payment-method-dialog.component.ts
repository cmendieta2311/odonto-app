import { Component, Inject, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentMethod, PaymentType } from '../payment-methods.service';

@Component({
    selector: 'app-payment-method-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './payment-method-dialog.component.html'
})
export class PaymentMethodDialogComponent implements OnInit {
    form!: FormGroup;
    types = Object.values(PaymentType);

    private fb = inject(FormBuilder);

    @Input() data: PaymentMethod | undefined;
    @Input() activeModal: any;

    ngOnInit() {
        this.form = this.fb.group({
            name: [this.data?.name || '', Validators.required],
            code: [this.data?.code || PaymentType.OTHER, Validators.required],
            isCash: [this.data?.isCash ?? false],
            requiresReference: [this.data?.requiresReference ?? false],
            isActive: [this.data?.isActive ?? true]
        });
    }

    save() {
        if (this.form.valid) {
            this.activeModal.close(this.form.value);
        }
    }

    cancel() {
        this.activeModal.close();
    }
}

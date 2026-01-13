import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SystemConfigService } from '../../system-config.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
    selector: 'app-config-billing',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './config-billing.html'
})
export class ConfigBillingComponent implements OnInit {
    private fb = inject(FormBuilder);
    private configService = inject(SystemConfigService);
    private notificationService = inject(NotificationService);

    billingForm: FormGroup;
    isSaving = false;
    constructor() {
        this.billingForm = this.fb.group({
            currency: ['PEN'],
            taxRate: [18],
            defaultExpirationDays: [7],
            quoteValidityDays: [15],
            electronicBilling: [false],
            allowedInstallments: ['1, 3, 6, 12'],
            calculateInterest: [false],
            interestRate: [0]
        });
    }

    ngOnInit() {
        this.loadConfigs();
    }

    loadConfigs() {
        this.configService.getConfigs().subscribe({
            next: (configs) => {
                if (configs['billing_config']) {
                    const billing = configs['billing_config'];
                    // Transform array to string for display
                    if (Array.isArray(billing.allowedInstallments)) {
                        billing.allowedInstallments = billing.allowedInstallments.join(', ');
                    }
                    this.billingForm.patchValue(billing);
                }
            },
            error: (err) => console.error('Error loading configs', err)
        });
    }

    save() {
        if (this.billingForm.invalid) return;

        this.isSaving = true;
        const billingValues = { ...this.billingForm.value };

        // Transform string back to array of numbers
        if (typeof billingValues.allowedInstallments === 'string') {
            billingValues.allowedInstallments = billingValues.allowedInstallments
                .split(',')
                .map((s: string) => parseInt(s.trim()))
                .filter((n: number) => !isNaN(n));
        }

        const payload = {
            billing_config: billingValues
        };

        this.configService.saveConfigs(payload).subscribe({
            next: () => {
                this.isSaving = false;
                this.notificationService.showSuccess('Configuración guardada correctamente');
            },
            error: (err) => {
                console.error('Error saving configs', err);
                this.isSaving = false;
                this.notificationService.showError('Error al guardar la configuración');
            }
        });
    }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ContractsService } from '../contracts.service';
import { QuotesService } from '../../quotes/quotes.service';
import { Quote } from '../../quotes/quotes.models';
import { PaymentMethod } from '../contracts.models';
import { SystemConfigService } from '../../configuration/system-config.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
    selector: 'app-contract-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink
    ],
    templateUrl: './contract-form.html',
    styleUrl: './contract-form.css'
})
export class ContractFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private quotesService = inject(QuotesService);
    private contractsService = inject(ContractsService);
    private notificationService = inject(NotificationService);
    private configService = inject(SystemConfigService);

    quoteId: string | null = null;
    contractId: string | null = null;
    quote: Quote | null = null;
    contract: any = null; // For view mode
    paymentMethods = PaymentMethod;
    viewMode = false; // true when viewing existing contract

    form = this.fb.group({
        paymentMethod: [PaymentMethod.CREDIT, Validators.required],
        initialPayment: [0, [Validators.min(0)]],
        startDate: [new Date().toISOString().split('T')[0], Validators.required],
        installments: [12, [Validators.required, Validators.min(1), Validators.max(24)]]
    });

    schedule: any[] = [];
    monthlyPayment = 0;
    totalFinanced = 0;
    interestAmount = 0;
    interestRate = 0; // Loaded from config
    calculateInterest = false; // Loaded from config

    ngOnInit() {
        this.loadSystemConfig();

        // Check if we're viewing an existing contract or creating from a quote
        this.contractId = this.route.snapshot.paramMap.get('contractId');
        this.quoteId = this.route.snapshot.paramMap.get('quoteId');

        if (this.contractId) {
            // View mode - load existing contract
            this.viewMode = true;
            this.loadContract(this.contractId);
        } else if (this.quoteId) {
            // Create mode - load quote
            this.viewMode = false;
            this.loadQuote(this.quoteId);
        }

        this.form.valueChanges.subscribe(() => {
            this.calculateFinancials();
        });
    }

    private loadSystemConfig() {
        this.configService.getConfigs().subscribe(configs => {
            if (configs['billing_config']) {
                const billing = configs['billing_config'];
                // interestRate comes as percentage (e.g. 5), convert to decimal (0.05) if needed or keep as is?
                // In quote-form, calculation is: subtotal * (interestRate / 100)
                // In contract-form, previously: subtotal * interestRate (where rate was 0.05)
                // So if config returns 5, we should divide by 100 to get factor, or adapt calculation.
                // Let's store the raw percentage and divide by 100 in calculation to be consistent with quote-form logic if possible, 
                // BUT logic here was `subtotal * this.interestRate` and rate was 0.05.
                // Let's stick to storing the factor (0.05) here to minimize calc changes, or update calc.
                // Quote form: `this.interestRate` stores e.g. 5. Calc: `subtotal * (this.interestRate / 100)`.
                // Let's store the percentage 5 here and update calc.
                this.interestRate = billing.interestRate ?? 0;
                this.calculateInterest = billing.calculateInterest ?? false;
                this.calculateFinancials();
            }
        });
    }

    private loadContract(id: string) {
        this.contractsService.getContract(id).subscribe(contract => {
            this.contract = contract;
            this.quote = contract.quote;

            // Populate form with contract data (read-only)
            this.form.patchValue({
                paymentMethod: contract.paymentMethod,
                initialPayment: 0, // We don't store this, calculate from total - financed
                startDate: contract.createdAt ? new Date(contract.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                installments: contract.installments || 1
            }, { emitEvent: false });

            // Disable form in view mode
            this.form.disable();

            // Load existing schedule if available
            if (contract.schedule && contract.schedule.length > 0) {
                this.schedule = contract.schedule.map((item: any, index: number) => ({
                    index: index + 1,
                    date: new Date(item.dueDate),
                    amount: item.amount,
                    status: item.status
                }));
            }

            this.calculateFinancials();
        });
    }

    private loadQuote(id: string) {
        this.quotesService.getQuote(id).subscribe(q => {
            this.quote = q;

            // Default values
            let method = PaymentMethod.CASH;
            let initial = 0;
            let installments = 1;

            if (q.financingEnabled) {
                method = PaymentMethod.CREDIT;
                initial = q.initialPayment || 0;
                installments = q.installments || 1;
            } else {
                // If not explicitly financed, defaults to CASH/1 installment. 
                // But we could keep the logic "if cash but has initial payment?" -> usually Cash is full payment.
                // For now, let's respect the quote data.
                initial = 0;
            }

            this.form.patchValue({
                paymentMethod: method,
                initialPayment: initial,
                installments: installments
            }, { emitEvent: false });

            this.calculateFinancials();
        });
    }

    setPaymentMethod(method: PaymentMethod) {
        this.form.patchValue({ paymentMethod: method });
        if (method === PaymentMethod.CASH) {
            this.form.patchValue({ installments: 1 });
        } else {
            this.form.patchValue({ installments: 12 });
        }
    }

    calculateFinancials() {
        if (!this.quote) return;

        const val = this.form.getRawValue();
        const total = Number(this.quote.total);
        const initial = Number(val.initialPayment) || 0;
        const isCredit = val.paymentMethod === PaymentMethod.CREDIT;

        let subtotal = total - initial;
        if (subtotal < 0) subtotal = 0;

        if (isCredit) {
            if (this.calculateInterest) {
                // Interest rate is percentage (e.g. 5), so we divide by 100
                this.interestAmount = subtotal * (this.interestRate / 100);
            } else {
                this.interestAmount = 0;
            }

            this.totalFinanced = subtotal + this.interestAmount;
            const installments = Number(val.installments) || 1;
            this.monthlyPayment = this.totalFinanced / installments;
        } else {
            this.interestAmount = 0;
            this.totalFinanced = subtotal;
            this.monthlyPayment = subtotal;
            // For CASH, installments should ideally be 1, which is handled by setPaymentMethod/form
        }

        this.generateSchedule();
    }

    generateSchedule() {
        if (!this.quote) return;

        const val = this.form.getRawValue();
        const installments = Number(val.installments) || 1;
        let startDate = new Date();
        if (val.startDate) {
            // Manual parse to ensure local time is used (avoid UTC shift)
            const [year, month, day] = val.startDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day);
        }

        const newSchedule = [];
        for (let i = 0; i < installments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);

            newSchedule.push({
                index: i + 1,
                date: dueDate,
                amount: this.monthlyPayment
            });
        }
        this.schedule = newSchedule;
    }

    get minInitialPayment() {
        if (!this.quote) return 0;
        return Math.round(Number(this.quote.total) * 0.2);
    }

    save() {
        if (this.form.invalid || !this.quoteId) return;

        const val = this.form.getRawValue();
        const payload = {
            quoteId: this.quoteId,
            paymentMethod: val.paymentMethod as any,
            installments: Number(val.installments)
        };

        this.contractsService.createContract(payload).subscribe({
            next: () => {
                this.notificationService.showSuccess('Contrato generado exitosamente');
                this.router.navigate(['/commercial/contracts']);
            },
            error: () => this.notificationService.showError('Error al generar contrato')
        });
    }

    cancel() {
        if (this.viewMode) {
            this.router.navigate(['/commercial/contracts']);
        } else {
            this.router.navigate(['/commercial/quotes']);
        }
    }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize, filter, map } from 'rxjs/operators';
import { PatientsService } from '../../patients/patients.service';
import { ContractsService } from '../../contracts/contracts.service';
import { PaymentsService } from '../../contracts/payments.service';
import { PaymentMethodsService, PaymentMethod } from '../../configuration/payment-methods/payment-methods.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
    selector: 'app-payment-registration',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './payment-registration.html',
    styleUrl: './payment-registration.css'
})
export class PaymentRegistrationComponent implements OnInit {
    private patientsService = inject(PatientsService);
    private contractsService = inject(ContractsService);
    private paymentsService = inject(PaymentsService);
    private paymentMethodsService = inject(PaymentMethodsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);

    // Search State
    searchControl = new FormControl('');
    showSuggestions = false;
    isSearching = false;
    patients: any[] = [];
    selectedPatient: any = null;

    // Contract/Installment State
    activeContracts: any[] = [];
    activeContract: any = null;
    installments: any[] = [];
    selectedInstallment: any = null;
    recentTransactions: any[] = []; // Using mock for now as endpoint needs check

    // Form State
    amount: number = 0;
    displayAmount: string = '';
    transactionDate: string = new Date().toISOString().split('T')[0];
    availablePaymentMethods: PaymentMethod[] = [];
    selectedPaymentMethod: PaymentMethod | null = null;
    notes: string = '';
    documentType: 'INVOICE' | 'RECEIPT' = 'INVOICE';
    isSaving = false;

    ngOnInit() {
        this.setupSearch();
        this.loadPaymentMethods();

        // Check for query params to pre-load patient/contract
        this.route.queryParams.subscribe(params => {
            if (params['patientId']) {
                this.patientsService.getPatient(params['patientId']).subscribe(patient => {
                    if (patient) {
                        this.selectPatient(patient, params['contractId']);
                    }
                });
            }
        });
    }

    loadPaymentMethods() {
        this.paymentMethodsService.findAll().subscribe(methods => {
            this.availablePaymentMethods = methods.filter(m => m.isActive);
            // Select default if exists (e.g. CASH)
            const defaultMethod = this.availablePaymentMethods.find(m => m.code === 'CASH');
            if (defaultMethod) this.selectedPaymentMethod = defaultMethod;
            else if (this.availablePaymentMethods.length > 0) this.selectedPaymentMethod = this.availablePaymentMethods[0];
        });
    }

    setupSearch() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            tap(() => {
                this.isSearching = true;
                this.showSuggestions = true;
                this.selectedPatient = null;
                this.activeContracts = [];
                this.activeContract = null;
                this.installments = [];
            }),
            switchMap(term => this.patientsService.getPatients(1, 10, term || '').pipe(
                map(res => res.data),
                finalize(() => this.isSearching = false)
            ))
        ).subscribe({
            next: (data) => {
                this.patients = data;
                this.showSuggestions = true;
            },
            error: (err) => console.error(err)
        });
    }

    selectPatient(patient: any, targetContractId?: string) {
        this.selectedPatient = patient;
        this.searchControl.setValue(`${patient.firstName} ${patient.lastName}`, { emitEvent: false });
        this.showSuggestions = false;
        this.loadContract(patient.id, targetContractId);
    }

    loadContract(patientId: string, targetContractId?: string) {
        this.contractsService.getContractsByPatient(patientId).subscribe({
            next: (contracts) => {
                // Find all active contracts
                this.activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE');

                if (this.activeContracts.length > 0) {
                    // Use target if provided and found, otherwise default to first
                    let contractToSelect = this.activeContracts[0];
                    if (targetContractId) {
                        const found = this.activeContracts.find(c => c.id === targetContractId);
                        if (found) contractToSelect = found;
                    }
                    this.setContract(contractToSelect);
                } else {
                    this.setContract(null);
                }
            },
            error: (err) => console.error(err)
        });
    }

    setContract(contract: any) {
        this.activeContract = contract;
        this.installments = [];
        this.amount = 0;
        this.displayAmount = '';
        this.selectedInstallment = null;

        if (this.activeContract) {
            // Map creditSchedule to installments if available
            if (this.activeContract.creditSchedule && this.activeContract.creditSchedule.length > 0) {
                this.installments = this.activeContract.creditSchedule;

                // Recalculate balance based on PENDING/OVERDUE installments
                const pendingTotal = this.installments
                    .filter((i: any) => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'PARTIALLY_PAID')
                    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

                if (pendingTotal > 0) {
                    this.activeContract.balance = pendingTotal;
                }
            }

            // Default: Select first pending installment logic or just use balance
            const firstPending = this.installments.find((i: any) => i.status === 'PENDING');
            if (firstPending) {
                this.selectInstallment(firstPending);
            } else {
                this.amount = this.activeContract.balance || 0;
                this.formatAmount(this.amount);
            }
        }
    }

    selectInstallment(inst: any) {
        this.selectedInstallment = inst;
        this.amount = Number(inst.amount) - (Number(inst.paidAmount) || 0);
        this.formatAmount(this.amount);
        // Optional: Indicate which installment is being paid in notes or separate field if backend supports it
        this.notes = `Pago de cuota vencimiento: ${inst.dueDate.split('T')[0]}`;
    }

    onAmountInput(value: string) {
        // Remove non-numeric chars
        const numericValue = value.replace(/[^0-9]/g, '');
        this.amount = numericValue ? Number(numericValue) : 0;
        this.formatAmount(this.amount);
    }

    formatAmount(value: number) {
        if (!value) {
            this.displayAmount = '';
            return;
        }
        // Format with thousands separator
        this.displayAmount = value.toLocaleString('es-PY');
    }

    selectPaymentMethod(method: PaymentMethod) {
        this.selectedPaymentMethod = method;
    }

    registerPayment() {
        if (!this.activeContract || this.amount <= 0 || this.isSaving || !this.selectedPaymentMethod) {
            // Optional: Add visual feedback for validation error
            if (this.amount <= 0) {
                this.notificationService.showError('El monto debe ser mayor a 0');
            }
            return;
        }

        this.isSaving = true;
        const dto = {
            contractId: this.activeContract.id,
            amount: Number(this.amount), // Ensure it is a number
            paymentMethodId: this.selectedPaymentMethod.id,
            notes: this.notes,
            documentType: this.documentType
        };

        this.paymentsService.createPayment(dto).subscribe({
            next: () => {
                this.isSaving = false;
                this.notificationService.showSuccess('Pago registrado exitosamente');
                this.router.navigate(['/payments']); // Navigate to list after success
            },
            error: (err) => {
                this.isSaving = false;
                console.error(err);
                const msg = err.error?.message || 'Error al registrar pago';
                this.notificationService.showError(msg);
            }
        });
    }

    resetForm() {
        this.searchControl.setValue('');
        this.selectedPatient = null;
        this.activeContract = null;
        this.installments = [];
        this.amount = 0;
        this.displayAmount = '';
        this.notes = '';
    }

    cancel() {
        this.router.navigate(['/']);
    }

    onBlur() {
        setTimeout(() => this.showSuggestions = false, 200);
    }
}

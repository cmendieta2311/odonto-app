import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize, filter, map } from 'rxjs/operators';
import { PatientsService } from '../../patients/patients.service';
import { ContractsService } from '../../contracts/contracts.service';
import { PaymentsService } from '../../contracts/payments.service';
import { PaymentMethod } from '../../contracts/contracts.models';

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
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    // Search State
    searchControl = new FormControl('');
    showSuggestions = false;
    isSearching = false;
    patients: any[] = [];
    selectedPatient: any = null;

    // Contract/Installment State
    // Contract/Installment State
    activeContracts: any[] = [];
    activeContract: any = null;
    installments: any[] = [];
    selectedInstallment: any = null;
    recentTransactions: any[] = []; // Using mock for now as endpoint needs check

    // Form State
    amount: number = 0;
    transactionDate: string = new Date().toISOString().split('T')[0];
    paymentMethod: string = 'CASH';
    notes: string = '';
    isSaving = false;

    ngOnInit() {
        this.setupSearch();

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
            }
        }
    }

    selectInstallment(inst: any) {
        this.selectedInstallment = inst;
        this.amount = Number(inst.amount) - (Number(inst.paidAmount) || 0);
        // Optional: Indicate which installment is being paid in notes or separate field if backend supports it
        this.notes = `Pago de cuota vencimiento: ${inst.dueDate.split('T')[0]}`;
    }

    selectPaymentMethod(method: string) {
        this.paymentMethod = method;
    }

    registerPayment() {
        if (!this.activeContract || this.amount <= 0 || this.isSaving) {
            // Optional: Add visual feedback for validation error
            if (this.amount <= 0) alert('El monto debe ser mayor a 0');
            return;
        }

        this.isSaving = true;
        const dto = {
            contractId: this.activeContract.id,
            amount: Number(this.amount), // Ensure it is a number
            method: this.paymentMethod, // Should match 'CASH', 'CREDIT_CARD', etc.
            notes: this.notes
        };

        this.paymentsService.createPayment(dto).subscribe({
            next: () => {
                this.isSaving = false;
                alert('Pago registrado exitosamente');
                this.router.navigate(['/payments']); // Navigate to list after success
            },
            error: (err) => {
                this.isSaving = false;
                console.error(err);
                alert('Error al registrar pago: ' + (err.error?.message || 'Error desconocido'));
            }
        });
    }

    resetForm() {
        this.searchControl.setValue('');
        this.selectedPatient = null;
        this.activeContract = null;
        this.installments = [];
        this.amount = 0;
        this.notes = '';
    }

    cancel() {
        this.router.navigate(['/']);
    }

    onBlur() {
        setTimeout(() => this.showSuggestions = false, 200);
    }
}

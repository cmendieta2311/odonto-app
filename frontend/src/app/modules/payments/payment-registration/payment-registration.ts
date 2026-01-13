import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize, filter, map, concatMap, toArray } from 'rxjs/operators';
import { forkJoin, from } from 'rxjs';
import { PatientsService } from '../../patients/patients.service';
import { ContractsService } from '../../contracts/contracts.service';
import { PaymentsService } from '../../contracts/payments.service';
import { PaymentMethodsService, PaymentMethod } from '../../configuration/payment-methods/payment-methods.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { PdfService } from '../../../shared/services/pdf.service';
import { SystemConfigService } from '../../configuration/system-config.service';
import { CashService } from '../../cash/cash.service';

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
    private pdfService = inject(PdfService);
    private configService = inject(SystemConfigService);
    private cashService = inject(CashService);

    isCashOpen = false;

    // Search State
    searchControl = new FormControl('');
    showSuggestions = false;
    isSearching = false;
    patients: any[] = [];
    selectedPatient: any = null;

    // Financial State
    totalPendingBalance = 0;
    activeContracts: any[] = [];

    // Selection State
    selectedInstallments: Set<string> = new Set(); // Stores IDs of selected installments
    totalSelectedAmount = 0;

    // Form State
    transactionDate: string = new Date().toISOString().split('T')[0];
    availablePaymentMethods: PaymentMethod[] = [];
    selectedPaymentMethod: PaymentMethod | null = null;
    notes: string = '';
    documentType: 'INVOICE' | 'RECEIPT' = 'INVOICE';
    isSaving = false;

    ngOnInit() {
        this.setupSearch();
        this.loadPaymentMethods();

        // Check for query params to pre-load patient
        this.route.queryParams.subscribe(params => {
            if (params['patientId']) {
                this.patientsService.getPatient(params['patientId']).subscribe(patient => {
                    if (patient) {
                        this.selectPatient(patient);
                    }
                });
            }
        });


        this.verifyCashStatus();
    }

    verifyCashStatus() {
        this.cashService.getStatus().subscribe(status => {
            if (!status.isOpen) {
                this.notificationService.showError('La caja está cerrada. Debe abrirla para registrar pagos.');
            }
            this.isCashOpen = status.isOpen;
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
                // this.activeContract = null; // Removed
                // this.installments = []; // Removed
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

    selectPatient(patient: any) {
        this.selectedPatient = patient;
        this.searchControl.setValue(`${patient.firstName} ${patient.lastName}`, { emitEvent: false });
        this.showSuggestions = false;
        this.loadContracts(patient.id);
    }

    loadContracts(patientId: string) {
        this.contractsService.getContractsByPatient(patientId).subscribe({
            next: (contracts) => {
                this.activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE' || c.balance > 0); // Include ACTIVE or with Debt
                this.calculateTotalPending();

                // Initialize expanded state and payment amounts
                this.activeContracts.forEach(c => {
                    c.isExpanded = true;
                    if (c.creditSchedule) {
                        c.creditSchedule.forEach((inst: any) => {
                            // Initialize with full pending amount
                            inst.paymentAmount = Number(inst.amount) - (Number(inst.paidAmount) || 0);
                        });
                    }
                });

                // Reset selection
                this.selectedInstallments.clear();
                this.calculateTotalSelected();
            },
            error: (err) => console.error(err)
        });
    }

    calculateTotalPending() {
        this.totalPendingBalance = this.activeContracts.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
    }

    // --- Selection Logic ---

    toggleContractExpand(contract: any) {
        contract.isExpanded = !contract.isExpanded;
    }

    // Check if all pending/overdue installments in a contract are selected
    isContractFullySelected(contract: any): boolean {
        if (!contract.creditSchedule || contract.creditSchedule.length === 0) return false;

        const payableInstallments = contract.creditSchedule.filter((i: any) => i.status !== 'PAID');
        if (payableInstallments.length === 0) return false;

        return payableInstallments.every((i: any) => this.selectedInstallments.has(i.id));
    }

    toggleContractSelection(contract: any, event: any) {
        const isChecked = event.target.checked;
        if (!contract.creditSchedule) return;

        contract.creditSchedule.forEach((inst: any) => {
            if (inst.status !== 'PAID') {
                if (isChecked) {
                    this.selectedInstallments.add(inst.id);
                } else {
                    this.selectedInstallments.delete(inst.id);
                }
            }
        });
        this.calculateTotalSelected();
    }

    isInstallmentSelected(inst: any): boolean {
        return this.selectedInstallments.has(inst.id);
    }

    toggleInstallmentSelection(inst: any) {
        if (this.selectedInstallments.has(inst.id)) {
            this.selectedInstallments.delete(inst.id);
        } else {
            this.selectedInstallments.add(inst.id);
        }
        this.calculateTotalSelected();
    }

    calculateTotalSelected() {
        this.totalSelectedAmount = 0;

        this.activeContracts.forEach(contract => {
            if (contract.creditSchedule) {
                contract.creditSchedule.forEach((inst: any) => {
                    if (this.selectedInstallments.has(inst.id)) {
                        // Use the edited paymentAmount
                        this.totalSelectedAmount += Number(inst.paymentAmount || 0);
                    }
                });
            }
        });
    }

    getDiscountedAmount(inst: any): number {
        // Placeholder if backend sends discounted amount
        return inst.amount;
    }

    onInstallmentAmountChange(inst: any, value: any) {
        // This method is now used to handle the raw value from the text input
        // Remove non-numeric characters to get the raw number
        const rawValue = String(value).replace(/\D/g, '');
        let numericValue = Number(rawValue);

        const maxAmount = Number(inst.amount) - (Number(inst.paidAmount) || 0);

        if (isNaN(numericValue) || numericValue < 0) {
            numericValue = 0;
        } else if (numericValue > maxAmount) {
            numericValue = maxAmount;
            this.notificationService.showError(`El monto no puede exceder el saldo pendiente de ${this.formatCurrency(maxAmount)}`);
        }

        inst.paymentAmount = numericValue;

        if (this.selectedInstallments.has(inst.id)) {
            this.calculateTotalSelected();
        }
    }



    // Helper to format currency for display/input
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    }

    // Helper to handle input input event
    onAmountInput(inst: any, event: any) {
        const input = event.target as HTMLInputElement;
        const rawValue = input.value.replace(/\D/g, '');
        const numericValue = rawValue ? parseInt(rawValue, 10) : 0;

        // Update model logic (validation etc)
        this.onInstallmentAmountChange(inst, numericValue);

        // Update input presentation
        input.value = this.formatCurrency(inst.paymentAmount);
    }



    // --- Form Logic ---

    onMethodChange() {
        // Logic if specific method requires extra fields
    }

    registerPayment() {
        if (this.totalSelectedAmount <= 0 || this.isSaving || !this.selectedPaymentMethod) return;

        if (!this.isCashOpen) {
            // Try to double check status before failing (in case user opened it in another tab)
            this.cashService.getStatus().subscribe({
                next: (status) => {
                    this.isCashOpen = status.isOpen;
                    if (this.isCashOpen) {
                        this.processPayment();
                    } else {
                        this.notificationService.showError('La caja está cerrada. Debe abrirla para registrar pagos.');
                    }
                },
                error: () => {
                    this.notificationService.showError('Error al verificar estado de caja.');
                }
            });
            return;
        }

        this.processPayment();
    }

    processPayment() {
        this.isSaving = true;

        const contractsInvolved = new Set<string>();
        this.activeContracts.forEach(c => {
            c.creditSchedule?.forEach((i: any) => {
                if (this.selectedInstallments.has(i.id)) contractsInvolved.add(c.id);
            });
        });

        const requests = Array.from(contractsInvolved).map(contractId => {
            const contract = this.activeContracts.find(c => c.id === contractId);
            const contractInstallments = contract.creditSchedule.filter((i: any) => this.selectedInstallments.has(i.id));

            // Calculate total based on user input for selected installments
            const amountForContract = contractInstallments.reduce((sum: number, i: any) => sum + Number(i.paymentAmount || 0), 0);

            // Construct notes with installment details including partial amounts
            const installmentNotes = contractInstallments.map((i: any) => {
                const isPartial = i.paymentAmount < (Number(i.amount) - (Number(i.paidAmount) || 0));

                // Format Date: dd/MM/yyyy
                const datePart = i.dueDate.split('T')[0];
                const [year, month, day] = datePart.split('-');
                const formattedDate = `${day}/${month}/${year}`;

                // Format Amount
                const formattedAmount = this.formatCurrency(i.paymentAmount);

                return `Cuota del ${formattedDate} (${isPartial ? 'Parcial: ' : ''}${formattedAmount})`;
            }).join(', ');
            const finalNotes = `${this.notes ? this.notes + ' - ' : ''}Pago de: ${installmentNotes}`;

            return this.paymentsService.createPayment({
                contractId: contractId,
                amount: amountForContract,
                paymentMethodId: this.selectedPaymentMethod!.id,
                notes: finalNotes,
                documentType: this.documentType
            });
        });

        if (requests.length === 0) {
            this.isSaving = false;
            return;
        }

        // Execute requests sequentially to avoid backend race conditions
        from(requests).pipe(
            concatMap(task => task),
            toArray()
        ).subscribe({
            next: (results) => {
                this.isSaving = false;
                this.notificationService.showSuccess(`Se registraron ${results.length} pagos exitosamente`);
                this.router.navigate(['/payments']);
            },
            error: (err) => {
                this.isSaving = false;
                console.error(err);
                this.notificationService.showError('Ocurrió un error al procesar los pagos.');
                if (this.selectedPatient) this.loadContracts(this.selectedPatient.id);
            }
        });
    }

    onBlur() {
        setTimeout(() => this.showSuggestions = false, 200);
    }

    generateStatement() {
        if (!this.selectedPatient) return;

        forkJoin({
            config: this.configService.getConfigs(),
            contracts: this.contractsService.getContractsByPatient(this.selectedPatient.id),
            payments: this.paymentsService.getPayments()
        }).subscribe({
            next: (data) => {
                const clinicInfo = {
                    ...data.config['clinic_info'],
                    logoUrl: data.config['clinicLogoUrl']
                };

                const contracts = data.contracts || [];
                const payments: any[] = (data.payments as any).data || [];

                const groupedData: any[] = [];
                const globalSummary = {
                    totalContract: 0,
                    totalInvoiced: 0,
                    totalPaid: 0,
                    pendingBalance: 0
                };

                console.log('Generating Statement. Contracts:', contracts);

                // Loop Contracts to build Groups
                contracts.forEach((c: any) => {
                    // Try to find a main invoice for this contract?
                    // Often a contract has multiple payments/invoices. 
                    // But in the design, it seems to Group by "Factura" or "Treatment Plan".
                    // We will Group by Contract, and label it with the Invoice # if available from the first payment?

                    // Let's first collect all installments and calculate group stats
                    const groupInstallments: any[] = [];
                    // Ensure total is treated as number
                    let groupTotal = Number(c.total || 0);
                    let installmentsTotal = 0;

                    let groupPaid = 0;
                    let groupPending = 0;

                    // We need a Title. Default: Contract #...
                    let title = `Contrato #${c.id.substring(0, 8).toUpperCase()}`;
                    // Try to get Treatment Name from Quote
                    let treatment = 'Tratamiento General';
                    if (c.quote?.items && c.quote.items.length > 0) {
                        // Join first 2 item names
                        treatment = c.quote.items.slice(0, 2).map((i: any) => i.name || i.serviceId).join(', ');
                        if (c.quote.items.length > 2) treatment += '...';
                    }

                    if (c.creditSchedule && c.creditSchedule.length > 0) {
                        c.creditSchedule.forEach((inst: any, index: number) => {
                            let paidAmount = 0;
                            let balance = Number(inst.amount);
                            let status = 'Pendiente'; // Default label

                            // Map Status
                            if (inst.status === 'PAID') {
                                status = 'Pagado';
                                paidAmount = Number(inst.amount);
                                balance = 0;
                            } else if (inst.status === 'OVERDUE') {
                                status = 'Vencido';
                            } else if (inst.status === 'PARTIALLY_PAID') {
                                status = 'Parcial';
                                // Ideally we know how much is paid. If not tracked in schedule, we might need to sum payments.
                                // simpler to assume 0 or check paidAmount if backend provides it (it usually does for partial)
                                paidAmount = Number(inst.paidAmount || 0);
                                balance = Number(inst.amount) - paidAmount;
                            }

                            installmentsTotal += Number(inst.amount);

                            // Update Group Stats
                            groupPaid += paidAmount;

                            groupInstallments.push({
                                number: `${String(index + 1).padStart(2, '0')} / ${String(c.creditSchedule.length).padStart(2, '0')}`,
                                dueDate: inst.dueDate,
                                amount: Number(inst.amount),
                                paid: paidAmount,
                                balance: balance,
                                status: status
                            });
                        });

                        // Fix for Zero Total: If contract total is 0 but we have installments, use the sum
                        if (groupTotal === 0 && installmentsTotal > 0) {
                            groupTotal = installmentsTotal;
                        }
                    } else {
                        // Contract without schedule (Direct)
                        // Treat as 1 installment
                        const isPaid = (c.status === 'COMPLETED' || c.balance === 0);
                        const paidAmt = isPaid ? groupTotal : 0;
                        groupPaid = paidAmt;

                        groupInstallments.push({
                            number: '01 / 01',
                            dueDate: c.createdAt,
                            amount: groupTotal,
                            paid: paidAmt,
                            balance: groupTotal - paidAmt,
                            status: isPaid ? 'Pagado' : 'Pendiente'
                        });
                    }

                    groupPending = groupTotal - groupPaid;

                    // Try to find an invoice number to override title?
                    // Check payments for this contract
                    const relatedPaymentWithInvoice = payments.find(p => p.contractId === c.id && p.invoice?.number);
                    if (relatedPaymentWithInvoice) {
                        title = `Factura #${relatedPaymentWithInvoice.invoice.number}`;
                    }

                    // Add to groupedData
                    groupedData.push({
                        title: title,
                        treatment: treatment,
                        totalAmount: groupTotal,
                        pendingBalance: groupPending,
                        installments: groupInstallments
                    });

                    // Update Global Summary
                    globalSummary.totalContract += groupTotal;
                    globalSummary.totalPaid += groupPaid;
                    // For Invoiced, we can assume Contract Total is Invoiced if there is an Invoice linked? 
                    // Or sum of payments with invoices?
                    // Let's sum payments with invoices as "Total Facturado" to be consistent with legal invoicing.
                    // Or in the mockup context "Total Facturado" seems to mean "Total Treatment Value".
                    // "TOTAL FACTURADO" usually implies "Total Billed/Contracted".
                    // Let's use Total Contract Value for "Total Facturado" in this context (Money asked for).
                    globalSummary.totalInvoiced += groupTotal;
                });

                globalSummary.pendingBalance = globalSummary.totalContract - globalSummary.totalPaid;

                console.log('Statement Data Generated:', { globalSummary, groupedData });

                // Sort groups by date? (We don't have a master date for group easily, maybe creation date of contract)
                // Assuming contracts come sorted or we sort by id.

                this.pdfService.generateAccountStatementPdf(this.selectedPatient, globalSummary, groupedData, clinicInfo);
            },
            error: (err) => {
                console.error(err);
                this.notificationService.showError('Error al generar el extracto de cuenta');
            }
        });
    }


    // Helper for date matching
    formatDateForSearch(dateStr: string): string {
        try {
            const [year, month, day] = dateStr.split('T')[0].split('-');
            return `${day}/${month}/${year}`;
        } catch (e) {
            return '';
        }
    }

    // Helper to allow template usage `Number(val)`
    Number(val: any) { return Number(val); }
}

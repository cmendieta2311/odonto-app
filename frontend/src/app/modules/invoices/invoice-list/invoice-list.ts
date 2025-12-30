import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoicesService } from '../invoices.service';
import { Invoice, InvoiceStatus } from '../invoices.models';
import { PaymentsService } from '../../contracts/payments.service';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './invoice-list.html',
    styleUrl: './invoice-list.css'
})
export class InvoiceListComponent implements OnInit {
    invoices: any[] = [];
    selectedInvoice: any = null;
    paymentForm: FormGroup;
    isProcessingPayment = false;

    filterForm: FormGroup;

    constructor(
        private invoicesService: InvoicesService,
        private paymentsService: PaymentsService,
        private router: Router,
        private fb: FormBuilder
    ) {
        this.paymentForm = this.fb.group({
            amount: [0, [Validators.required, Validators.min(0.01)]],
            method: ['CASH', Validators.required]
        });

        this.filterForm = this.fb.group({
            search: [''],
            dateRange: [''],
            status: ['Todos']
        });
    }

    ngOnInit(): void {
        this.loadInvoices();

        // Subscribe to filter changes
        this.filterForm.valueChanges.subscribe(() => {
            this.loadInvoices();
        });
    }

    loadInvoices() {
        const filters = this.filterForm.value;
        const queryParams: any = {
            search: filters.search,
            status: filters.status
        };

        if (filters.dateRange) {
            // Parse simple format DD/MM/AAAA - DD/MM/AAAA
            const parts = filters.dateRange.split(' - ');
            if (parts.length === 2) {
                const [start, end] = parts;
                // Convert to ISO format for backend if valid dates
                // Assuming format DD/MM/YYYY
                const startDateParts = start.split('/');
                const endDateParts = end.split('/');

                if (startDateParts.length === 3 && endDateParts.length === 3) {
                    const isoStart = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]}`;
                    const isoEnd = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]}`;
                    queryParams.startDate = isoStart;
                    queryParams.endDate = isoEnd;
                }
            }
        }

        this.invoicesService.findAll(queryParams).subscribe({
            next: (data) => {
                this.invoices = data.map(inv => this.mapInvoiceToView(inv));
            },
            error: (err) => console.error('Error loading invoices', err)
        });
    }

    mapInvoiceToView(inv: Invoice): any {
        const patientName = inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Desconocido';
        const initials = inv.patient ?
            (inv.patient.firstName?.charAt(0) || '') + (inv.patient.lastName?.charAt(0) || '') :
            '?';

        let statusClass = '';
        let statusLabel = '';

        switch (inv.status) {
            case InvoiceStatus.PAID:
                statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                statusLabel = 'Pagado';
                break;
            case InvoiceStatus.PENDING:
                statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                statusLabel = 'Pendiente';
                break;
            case InvoiceStatus.CANCELLED:
                statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                statusLabel = 'Cancelado';
                break;
            case InvoiceStatus.PARTIALLY_PAID:
                statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                statusLabel = 'Parcial';
                break;
            default:
                statusClass = 'bg-gray-100 text-gray-800';
                statusLabel = inv.status;
        }

        return {
            id: inv.id,
            number: inv.number || inv.id,
            dbId: inv.id,
            date: new Date(inv.issuedAt).toLocaleDateString(),
            patientName: patientName,
            patientInitials: initials,
            patientImage: null,
            concept: inv.items && inv.items.length > 0 ? inv.items[0].description + (inv.items.length > 1 ? '...' : '') : 'Servicios Varios',
            status: statusLabel,
            statusCode: inv.status,
            statusClass: statusClass,
            amount: inv.amount,
            balance: inv.balance,
            isCancelled: inv.status === InvoiceStatus.CANCELLED
        };
    }

    navigateToCreateInvoice() {
        this.router.navigate(['/admin/invoices/new']);
    }

    openPaymentModal(invoice: any) {
        this.selectedInvoice = invoice;
        this.paymentForm.patchValue({
            amount: invoice.balance,
            method: 'CASH'
        });
    }

    closePaymentModal() {
        this.selectedInvoice = null;
        this.paymentForm.reset();
    }

    registerPayment() {
        if (this.paymentForm.invalid || !this.selectedInvoice) return;

        this.isProcessingPayment = true;
        const { amount, method } = this.paymentForm.value;

        this.paymentsService.createPayment({
            invoiceId: this.selectedInvoice.dbId,
            amount: Number(amount),
            method: method
        }).subscribe({
            next: () => {
                this.isProcessingPayment = false;
                this.closePaymentModal();
                this.loadInvoices(); // Refresh list to show updated status
                alert('Pago registrado correctamente');
            },
            error: (err) => {
                this.isProcessingPayment = false;
                console.error(err);
                alert('Error al registrar pago');
            }
        });
    }
}

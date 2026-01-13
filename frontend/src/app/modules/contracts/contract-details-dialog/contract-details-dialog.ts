import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Contract } from '../contracts.models';

@Component({
    selector: 'app-contract-details-dialog',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './contract-details-dialog.html',
    styleUrl: './contract-details-dialog.css'
})
export class ContractDetailsDialogComponent {
    @Input() contract: Contract | undefined;

    // Support either direct input or data object wrapper
    @Input() data: { contract: Contract } | undefined;
    @Input() activeModal: any;

    ngOnInit() {
        if (this.data && this.data.contract) {
            this.contract = this.data.contract;
        }
    }

    close() {
        this.activeModal.close();
    }

    getStatusLabel(status: string): string {
        const statusMap: { [key: string]: string } = {
            'ACTIVE': 'Activo',
            'COMPLETED': 'Finalizado',
            'CANCELLED': 'Anulado'
        };
        return statusMap[status] || status;
    }

    getPaymentMethodLabel(method: string): string {
        const methodMap: { [key: string]: string } = {
            'CASH': 'Contado',
            'CREDIT': 'Crédito',
            'CREDIT_CARD': 'Tarjeta de Crédito',
            'DEBIT_CARD': 'Tarjeta de Débito',
            'TRANSFER': 'Transferencia',
            'OTHER': 'Otro'
        };
        return methodMap[method] || method;
    }
}

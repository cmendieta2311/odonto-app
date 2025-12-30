import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Contract } from '../contracts.models';

@Component({
    selector: 'app-contract-details-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule
    ],
    templateUrl: './contract-details-dialog.html',
    styleUrl: './contract-details-dialog.css'
})
export class ContractDetailsDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ContractDetailsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public contract: Contract
    ) { }

    close() {
        this.dialogRef.close();
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

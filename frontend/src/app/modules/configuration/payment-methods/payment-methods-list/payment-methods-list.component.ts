import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMethodsService, PaymentMethod } from '../payment-methods.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PaymentMethodDialogComponent } from '../payment-method-dialog/payment-method-dialog.component';

@Component({
    selector: 'app-payment-methods-list',
    standalone: true,
    imports: [CommonModule, MatDialogModule],
    templateUrl: './payment-methods-list.component.html'
})
export class PaymentMethodsListComponent implements OnInit {
    methods: PaymentMethod[] = [];

    constructor(private service: PaymentMethodsService, private dialog: MatDialog) { }

    ngOnInit() {
        this.loadMethods();
    }

    loadMethods() {
        this.service.findAll().subscribe(data => this.methods = data);
    }

    addMethod() {
        const dialogRef = this.dialog.open(PaymentMethodDialogComponent, {
            width: '500px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.service.create(result).subscribe(() => this.loadMethods());
            }
        });
    }

    editMethod(method: PaymentMethod) {
        const dialogRef = this.dialog.open(PaymentMethodDialogComponent, {
            width: '500px',
            data: method
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.service.update(method.id, result).subscribe(() => this.loadMethods());
            }
        });
    }

    deleteMethod(method: PaymentMethod) {
        if (confirm(`¿Está seguro de eliminar ${method.name}?`)) {
            this.service.remove(method.id).subscribe(() => this.loadMethods());
        }
    }

    getPaymentTypeLabel(code: string): string {
        const labels: any = {
            'CASH': 'Efectivo',
            'CREDIT_CARD': 'Tarjeta de Crédito',
            'DEBIT_CARD': 'Tarjeta de Débito',
            'TRANSFER': 'Transferencia',
            'CREDIT': 'Crédito',
            'OTHER': 'Otro'
        };
        return labels[code] || code;
    }
}

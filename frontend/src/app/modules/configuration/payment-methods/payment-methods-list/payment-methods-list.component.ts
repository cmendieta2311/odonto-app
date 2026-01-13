import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMethodsService, PaymentMethod } from '../payment-methods.service';
import { PaymentMethodDialogComponent } from '../payment-method-dialog/payment-method-dialog.component';
import { ModalService } from '../../../../shared/components/modal/modal.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
    selector: 'app-payment-methods-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-methods-list.component.html'
})
export class PaymentMethodsListComponent implements OnInit {
    methods: PaymentMethod[] = [];

    private service = inject(PaymentMethodsService);
    private modalService = inject(ModalService);

    ngOnInit() {
        this.loadMethods();
    }

    loadMethods() {
        this.service.findAll().subscribe(data => this.methods = data);
    }

    addMethod() {
        const modalRef = this.modalService.open(PaymentMethodDialogComponent, {
            width: '500px'
        });

        modalRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.service.create(result).subscribe(() => this.loadMethods());
            }
        });
    }

    editMethod(method: PaymentMethod) {
        const modalRef = this.modalService.open(PaymentMethodDialogComponent, {
            width: '500px',
            data: method
        });

        modalRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.service.update(method.id, result).subscribe(() => this.loadMethods());
            }
        });
    }

    deleteMethod(method: PaymentMethod) {
        const modalRef = this.modalService.open(ConfirmationDialogComponent, {
            width: '400px',
            data: {
                title: 'Eliminar Método de Pago',
                message: `¿Está seguro de eliminar ${method.name}?`,
                confirmText: 'Eliminar',
                color: 'warn'
            } as ConfirmationDialogData
        });

        modalRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.service.remove(method.id).subscribe(() => this.loadMethods());
            }
        });
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

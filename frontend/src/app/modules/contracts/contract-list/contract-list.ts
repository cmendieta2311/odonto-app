import { Component, OnInit, inject } from '@angular/core';
import { BaseListComponent } from '../../../shared/classes/base-list.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ModalService } from '../../../shared/components/modal/modal.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ContractsService } from '../contracts.service';
import { PaymentsService } from '../payments.service';
import { Contract, PaymentMethod } from '../contracts.models';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog';
import { ScheduleDialogComponent } from '../schedule-dialog/schedule-dialog';
import { ContractDetailsDialogComponent } from '../contract-details-dialog/contract-details-dialog';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CustomTableComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './contract-list.html',
  styleUrl: './contract-list.css'
})
export class ContractListComponent extends BaseListComponent<Contract> implements OnInit {
  contractsService = inject(ContractsService);
  paymentsService = inject(PaymentsService);
  modalService = inject(ModalService);
  router = inject(Router);

  statusFilter = '';
  methodFilter = '';
  searchControl = new FormControl('');

  columns: TableColumn[] = [
    { key: 'patient', label: 'Paciente' },
    { key: 'id', label: 'N° Contrato' },
    { key: 'createdAt', label: 'Inicio' },
    { key: 'total', label: 'Total' },
    { key: 'financed', label: 'Financiado' },
    { key: 'status', label: 'Estado', class: 'text-center' }
  ];

  override ngOnInit() {
    super.ngOnInit();

    this.searchControl.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged()
    ).subscribe(value => {
      this.onSearch(value || '');
    });
  }

  loadData() {
    this.isLoading = true;
    this.contractsService.getContracts(this.page, this.pageSize, this.searchQuery, this.statusFilter, this.methodFilter)
      .subscribe({
        next: (res) => {
          this.data = res.data;
          this.totalItems = res.meta.total;
          this.isLoading = false;
        },
        error: (err) => this.handleError(err)
      });
  }

  onFilterChange() {
    this.page = 1;
    this.loadData();
  }

  // Removed client-side applyFilters

  viewSchedule(contract: Contract) {
    const schedule = contract.creditSchedule || contract.schedule;
    if (schedule && schedule.length > 0) {
      this.modalService.open(ScheduleDialogComponent, {
        width: '600px',
        data: { schedule: schedule }
      });
    } else {
      this.notificationService.showMessage('Este contrato no tiene cronograma de crédito.');
    }
  }

  registerPayment(contract: Contract) {
    const modalRef = this.modalService.open(PaymentDialogComponent, {
      width: '400px',
      data: { contractId: contract.id, balance: contract.balance }
    });

    modalRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Payment is actually created IN the dialog, the dialog returns the result object.
        // Wait, PaymentDialog logic:
        // this.paymentsService.createPayment(dto).subscribe({... close(res) })
        // So when we get result, payment is already created.
        // We just need to reload.
        // Wait, check original ContractListComponent.registerPayment:
        /*
          if (result) {
             this.paymentsService.createPayment(...).subscribe(...)
          }
        */
        // OLD ContractList logic created payment AFTER dialog closed?
        // Let's check original PaymentDialog (Step 501):
        // `save()` calls `this.paymentsService.createPayment` AND then `close(res)`.
        // So PaymentDialog was ALREADY creating the payment.
        // AND ContractListComponent was ALSO creating the payment??? DOUBLE CHARGE?
        // Let's re-read Step 503 (ContractListComponent):
        /*
             ref.afterClosed().subscribe(result => {
               if (result) {
                 this.paymentsService.createPayment(...)
        */
        // AND Step 501 (PaymentDialog):
        /*
             save() { ... this.paymentsService.createPayment(...).subscribe({ ... close(res) }) }
        */
        // This means the previous code WAS creating duplicated payments? Or logic was messy.
        // Or maybe Step 501 `PaymentDialog` had createPayment code, OR maybe `ContractList` was older version?
        // But `PaymentDialog` clearly has `paymentsService.createPayment`.
        // If `PaymentDialog` creates it, then `ContractList` shouldn't.
        // I should just reload data in `ContractList`.

        this.notificationService.showSuccess('Pago registrado');
        this.loadData();
      }
    });
  }

  viewContractDetails(contract: Contract) {
    this.router.navigate(['/commercial/contracts/view', contract.id]);
  }


}

import { Component, OnInit, inject } from '@angular/core';
import { BaseListComponent } from '../../../shared/classes/base-list.component';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
    MatDialogModule,
    MatSnackBarModule,
    CustomTableComponent,
    FormsModule
  ],
  templateUrl: './contract-list.html',
  styleUrl: './contract-list.css'
})
export class ContractListComponent extends BaseListComponent<Contract> implements OnInit {
  contractsService = inject(ContractsService);
  paymentsService = inject(PaymentsService);
  router = inject(Router);

  statusFilter = '';
  methodFilter = '';

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
      this.dialog.open(ScheduleDialogComponent, {
        width: '600px',
        data: { schedule: schedule }
      });
    } else {
      alert('Este contrato no tiene cronograma de crédito.');
    }
  }

  registerPayment(contract: Contract) {
    const ref = this.dialog.open(PaymentDialogComponent, {
      width: '400px',
      data: { contractId: contract.id, balance: contract.balance }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.paymentsService.createPayment({
          contractId: contract.id,
          amount: result.amount,
          method: result.method
        }).subscribe(() => {
          this.snackBar.open('Pago registrado', 'Cerrar', { duration: 3000 });
          this.loadData(); // Reload to update balance
        });
      }
    });
  }

  viewContractDetails(contract: Contract) {
    this.router.navigate(['/commercial/contracts/view', contract.id]);
  }


}

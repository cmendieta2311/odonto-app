import { Component, OnInit, inject } from '@angular/core';
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
export class ContractListComponent implements OnInit {
  contractsService = inject(ContractsService);
  paymentsService = inject(PaymentsService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  searchQuery = '';
  statusFilter = '';
  methodFilter = '';

  columns: TableColumn[] = [
    { key: 'patient', label: 'Paciente' },
    { key: 'id', label: 'Ref. Contrato' },
    { key: 'createdAt', label: 'Inicio' },
    { key: 'total', label: 'Total' },
    { key: 'financed', label: 'Financiado' },
    { key: 'status', label: 'Estado', class: 'text-center' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.contractsService.getContracts().subscribe(data => {
      this.contracts = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredContracts = this.contracts.filter(c => {
      const patientName = `${c.quote?.patient?.firstName} ${c.quote?.patient?.lastName}`.toLowerCase();
      const matchesSearch = !this.searchQuery ||
        patientName.includes(this.searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.quoteId.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.statusFilter || c.status.toLowerCase() === this.statusFilter.toLowerCase();
      const matchesMethod = !this.methodFilter || c.paymentMethod === this.methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }

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

  generateProforma(contract: Contract) {
    this.contractsService.generateProforma(contract.id).subscribe({
      next: () => {
        this.snackBar.open('Proforma generada exitosamente', 'Cerrar', { duration: 3000 });
        this.loadData(); // Reload to show proforma
      },
      error: (err) => {
        const message = err.error?.message || 'Error al generar proforma';
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
      }
    });
  }
}

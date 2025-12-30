import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { QuotesService } from '../quotes.service';
import { ContractsService } from '../../contracts/contracts.service';
import { Quote, QuoteStatus } from '../quotes.models';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatDialogModule,
    CustomTableComponent,
    FormsModule
  ],
  templateUrl: './quote-list.html',
  styleUrl: './quote-list.css'
})
export class QuoteListComponent implements OnInit {
  quotesService = inject(QuotesService);
  contractsService = inject(ContractsService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  QuoteStatus = QuoteStatus;

  quotes: Quote[] = [];
  filteredQuotes: Quote[] = [];
  searchQuery = '';
  statusFilter = '';

  columns: TableColumn[] = [
    { key: 'createdAt', label: 'Fecha' },
    { key: 'patient', label: 'Paciente' },
    { key: 'total', label: 'Total ($)' },
    { key: 'status', label: 'Estado' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.quotesService.getQuotes().subscribe(data => {
      this.quotes = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredQuotes = this.quotes.filter(q => {
      const matchesSearch = !this.searchQuery ||
        `${q.patient?.firstName} ${q.patient?.lastName}`.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.statusFilter || q.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  navigateToQuoteForm(quoteId?: string) {
    if (quoteId) {
      this.router.navigate(['/commercial/quotes/edit', quoteId]);
    } else {
      this.router.navigate(['/commercial/quotes/new']);
    }
  }

  deleteQuote(quote: Quote) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Presupuesto',
        message: '¿Estás seguro de querer eliminar este presupuesto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.quotesService.deleteQuote(quote.id).subscribe({
          next: () => {
            this.loadData();
            this.snackBar.open('Presupuesto eliminado', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            console.error(err);
            const msg = err.error?.message || 'Error al eliminar presupuesto';
            this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
          }
        });
      }
    });
  }

  convertToContract(quote: Quote) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Generar Contrato',
        message: '¿Deseas generar un contrato basado en este presupuesto?',
        confirmText: 'Generar',
        color: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.router.navigate(['/commercial/contracts/generate', quote.id]);
      }
    });
  }

  updateStatus(quote: Quote, newStatus: QuoteStatus | string) {
    const status = newStatus as QuoteStatus;
    const isApprove = status === QuoteStatus.APPROVED;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: isApprove ? 'Aceptar Presupuesto' : 'Rechazar Presupuesto',
        message: isApprove
          ? '¿Confirmas la aceptación de este presupuesto? Pasará a estado Aceptado.'
          : '¿Confirmas el rechazo de este presupuesto?',
        confirmText: isApprove ? 'Aceptar' : 'Rechazar',
        color: isApprove ? 'primary' : 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.quotesService.updateQuote(quote.id, { status: status }).subscribe({
          next: () => {
            this.loadData();
            this.snackBar.open(`Presupuesto ${isApprove ? 'aceptado' : 'rechazado'}`, 'Cerrar', { duration: 3000 });
          },
          error: () => this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}

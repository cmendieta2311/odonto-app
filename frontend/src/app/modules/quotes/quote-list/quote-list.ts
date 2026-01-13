import { Component, OnInit, inject } from '@angular/core';
import { BaseListComponent } from '../../../shared/classes/base-list.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { QuotesService } from '../quotes.service';
import { ContractsService } from '../../contracts/contracts.service';
import { Quote, QuoteStatus } from '../quotes.models';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { PdfService } from '../../../shared/services/pdf.service';
import { SystemConfigService } from '../../configuration/system-config.service';
import { ModalService } from '../../../shared/components/modal/modal.service';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    CommonModule,
    CustomTableComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './quote-list.html',
  styleUrl: './quote-list.css'
})
export class QuoteListComponent extends BaseListComponent<Quote> implements OnInit {
  quotesService = inject(QuotesService);
  contractsService = inject(ContractsService);
  pdfService = inject(PdfService);
  configService = inject(SystemConfigService);
  modalService = inject(ModalService);
  router = inject(Router);
  QuoteStatus = QuoteStatus;

  statusFilter = '';

  searchControl = new FormControl('');

  columns: TableColumn[] = [
    { key: 'number', label: 'N°' },
    { key: 'createdAt', label: 'Fecha' },
    { key: 'patient', label: 'Paciente' },
    { key: 'total', label: 'Total ($)' },
    { key: 'status', label: 'Estado' }
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

  downloadPdf(quote: Quote) {
    this.quotesService.getQuote(quote.id).subscribe(fullQuote => {
      if (!fullQuote) return;
      this.configService.getConfigs().subscribe(configs => {
        const clinicInfo = {
          ...configs['clinic_info'],
          logoUrl: configs['clinicLogoUrl']
        };
        const validityDays = configs['billing_config']?.quoteValidityDays ?? 15;
        this.pdfService.generateQuotePdf(fullQuote, clinicInfo, validityDays);
      });
    });
  }

  loadData() {
    this.isLoading = true;
    this.quotesService.getQuotes(this.page, this.pageSize, this.searchQuery, this.statusFilter)
      .subscribe({
        next: (res) => {
          this.data = res.data;
          this.totalItems = res.meta.total;
          this.isLoading = false;
        },
        error: (err) => this.handleError(err)
      });
  }

  onStatusChange() {
    this.page = 1;
    this.loadData();
  }

  navigateToQuoteForm(quoteId?: string) {
    if (quoteId) {
      this.router.navigate(['/commercial/quotes/edit', quoteId]);
    } else {
      this.router.navigate(['/commercial/quotes/new']);
    }
  }

  deleteQuote(quote: Quote) {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Presupuesto',
        message: '¿Estás seguro de querer eliminar este presupuesto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        color: 'warn'
      } as ConfirmationDialogData
    });

    modalRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.quotesService.deleteQuote(quote.id).subscribe({
          next: () => {
            this.loadData();
            this.notificationService.showSuccess('Presupuesto eliminado');
          },
          error: (err) => {
            console.error(err);
            const msg = err.error?.message || 'Error al eliminar presupuesto';
            this.notificationService.showError(msg);
          }
        });
      }
    });
  }

  convertToContract(quote: Quote) {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Generar Contrato',
        message: '¿Deseas generar un contrato basado en este presupuesto?',
        confirmText: 'Generar',
        color: 'primary'
      } as ConfirmationDialogData
    });

    modalRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.router.navigate(['/commercial/contracts/generate', quote.id]);
      }
    });
  }

  updateStatus(quote: Quote, newStatus: QuoteStatus | string) {
    const status = newStatus as QuoteStatus;
    const isApprove = status === QuoteStatus.APPROVED;

    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: isApprove ? 'Aceptar Presupuesto' : 'Rechazar Presupuesto',
        message: isApprove
          ? '¿Confirmas la aceptación de este presupuesto? Pasará a estado Aceptado.'
          : '¿Confirmas el rechazo de este presupuesto?',
        confirmText: isApprove ? 'Aceptar' : 'Rechazar',
        color: isApprove ? 'primary' : 'warn'
      } as ConfirmationDialogData
    });

    modalRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.quotesService.updateQuote(quote.id, { status: status }).subscribe({
          next: () => {
            this.loadData();
            this.notificationService.showSuccess(`Presupuesto ${isApprove ? 'aceptado' : 'rechazado'}`);
          },
          error: () => this.notificationService.showError('Error al actualizar estado')
        });
      }
    });
  }
}

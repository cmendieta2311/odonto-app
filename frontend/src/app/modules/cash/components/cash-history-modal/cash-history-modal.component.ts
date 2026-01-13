import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashService, CashSession, CashMovement, CashMovementType } from '../../cash.service';
import { PdfService } from '../../../../shared/services/pdf.service';
import { SystemConfigService } from '../../../configuration/system-config.service';
import { AuthService } from '../../../../auth/auth.service';

@Component({
   selector: 'app-cash-history-modal',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300" (click)="onClose()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between sticky top-0 z-10">
          <h3 class="text-slate-900 dark:text-white font-bold text-xl">Historial de Turnos/Sesiones</h3>
          <button class="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors" (click)="onClose()">
             <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
           <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table class="w-full text-sm text-left">
               <thead class="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                     <th class="px-6 py-3">Apertura</th>
                     <th class="px-6 py-3">Cierre</th>
                     <th class="px-6 py-3">Responsable</th>
                     <th class="px-6 py-3 text-right">Saldo Inicial</th>
                     <th class="px-6 py-3 text-right">Saldo Final</th>
                     <th class="px-6 py-3 text-center">Estado</th>
                     <th class="px-6 py-3 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900/50">
                  <tr *ngFor="let session of history" class="hover:bg-slate-50 dark:hover:bg-white/5">
                     <td class="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                        {{ session.startTime | date:'short' }}
                     </td>
                     <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {{ session.endTime ? (session.endTime | date:'short') : '-' }}
                     </td>
                     <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div class="flex flex-col">
                            <span>{{ session.openedBy }}</span>
                            <span *ngIf="session.closedBy && session.closedBy !== session.openedBy" class="text-xs text-slate-400">Cierre: {{ session.closedBy }}</span>
                        </div>
                     </td>
                     <td class="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-300">{{ session.startBalance | currency: 'PYG':'symbol-narrow':'1.0-0' }}</td>
                     <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{{ session.finalBalance | currency: 'PYG':'symbol-narrow':'1.0-0' }}</td>
                     <td class="px-6 py-4 text-center">
                        <span *ngIf="session.status === 'CLOSED'" class="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">Cerrado</span>
                        <span *ngIf="session.status === 'OPEN'" class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 animate-pulse">Abierto</span>
                     </td>
                     <td class="px-6 py-4 text-center">
                        <button (click)="downloadReport(session)" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Descargar Reporte">
                           <span class="material-symbols-outlined">download</span>
                        </button>
                     </td>
                  </tr>
                  <tr *ngIf="history.length === 0">
                     <td colspan="7" class="py-8 text-center text-slate-500">No hay historial de sesiones</td>
                  </tr>
               </tbody>
            </table>
           </div>
        </div>
      </div>
    </div>
  `
})
export class CashHistoryModalComponent implements OnInit {
   @Input() cashRegisterId?: string;
   @Output() close = new EventEmitter<void>();
   history: CashSession[] = [];

   paymentMethodsMap: Record<string, string> = {
      'CASH': 'Efectivo',
      'CREDIT_CARD': 'Tarjeta de Crédito',
      'DEBIT_CARD': 'Tarjeta de Débito',
      'TRANSFER': 'Transferencia',
      'QR': 'QR',
      'OTHER': 'Otro'
   };

   constructor(
      private cashService: CashService,
      private pdfService: PdfService,
      private configService: SystemConfigService,
      private authService: AuthService
   ) { }

   ngOnInit() {
      this.cashService.getHistory(this.cashRegisterId).subscribe(data => {
         this.history = data;
      });
   }

   downloadReport(session: CashSession) {
      if (!session.id) return;

      this.cashService.findAll(undefined, this.cashRegisterId, session.id).subscribe(movements => {
         this.configService.getConfigs().subscribe(configs => {
            const clinicInfo = {
               ...configs['clinic_info'],
               logoUrl: configs['clinicLogoUrl']
            };

            // Calculate Summary for this session
            const income = movements
               .filter(m => m.type === CashMovementType.INCOME)
               .reduce((sum, m) => sum + Number(m.amount), 0);

            const expense = movements
               .filter(m => m.type === CashMovementType.EXPENSE)
               .reduce((sum, m) => sum + Number(m.amount), 0);

            const reportData = {
               summary: {
                  income,
                  expense,
                  balance: income - expense
               },
               movements: movements.map(m => ({
                  ...m,
                  paymentMethod: this.paymentMethodsMap[m.paymentMethod] || m.paymentMethod
               })),
               status: {
                  id: session.id,
                  isOpen: session.status === 'OPEN',
                  isClosed: session.status === 'CLOSED',
                  startBalance: session.startBalance,
                  currentBalance: session.finalBalance,
                  income,
                  expense,
                  openedBy: session.openedBy,
                  openingTime: session.startTime,
                  closingTime: session.endTime
               },
               date: new Date(session.startTime),
               userName: this.authService.currentUser()?.name,
               openUser: session.openedBy
            };

            this.pdfService.generateCashReportPdf(reportData, clinicInfo);
         });
      });
   }

   onClose() {
      this.close.emit();
   }
}

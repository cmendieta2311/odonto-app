import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashService, CashMovement, DailySummary, CashMovementType, CashStatus } from '../../cash.service';
import { CashMovementFormComponent } from '../../components/cash-movement-form/cash-movement-form.component';
import { CashHistoryModalComponent } from '../../components/cash-history-modal/cash-history-modal.component';
import { CashOpenModalComponent } from '../../components/cash-open-modal/cash-open-modal.component';
import { CashCloseModalComponent } from '../../components/cash-close-modal/cash-close-modal.component';
import { PdfService } from '../../../../shared/services/pdf.service';
import { SystemConfigService } from '../../../configuration/system-config.service';
import { AuthService } from '../../../../auth/auth.service';

@Component({
   selector: 'app-cash-dashboard',
   standalone: true,
   imports: [CommonModule, FormsModule, CashMovementFormComponent, CashHistoryModalComponent, CashOpenModalComponent, CashCloseModalComponent],
   template: `
   <div class="p-6 md:p-10 space-y-6">
      
      <!--Header Section-->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Gestión de Caja</h1>
            <div class="flex items-center gap-2 mt-1">
               <span class="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
               <span class="text-slate-500 dark:text-slate-400 text-sm font-medium">{{ currentDate | date: 'fullDate' }}</span>

               <span *ngIf="status.isOpen" class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Caja Abierta
               </span>
               <span *ngIf="status.isClosed" class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Caja Cerrada
               </span>
               <span *ngIf="!status.isOpen && !status.isClosed" class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  No Iniciada
               </span>
            </div>
         </div>

         <div class="flex items-center gap-3">
            <button (click)="openHistory()" class="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold transition-colors flex items-center gap-2">
               <span class="material-symbols-outlined text-[20px]">history</span>
               Historial
            </button>

            <button *ngIf="!status.isOpen" (click)="openCash()" class="h-10 px-4 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-bold transition-colors flex items-center gap-2">
               <span class="material-symbols-outlined text-[20px]">lock_open</span>
               Abrir Caja
            </button>

            <button *ngIf="status.isOpen" (click)="closeCash()" class="h-10 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-colors flex items-center gap-2">
               <span class="material-symbols-outlined text-[20px]">lock</span>
               Cerrar Caja
            </button>

            <button (click)="openModal()" [disabled]="!status.isOpen" class="h-10 px-4 rounded-lg bg-primary hover:bg-[#0fd692] text-slate-900 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
               <span class="material-symbols-outlined text-[20px]">add_circle</span>
               Registrar Movimiento
            </button>
         </div>
      </div>

      <!--Summary Cards-->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
         <!--Saldo Inicial-->
         <div class="bg-white dark:bg-card-dark rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div class="flex items-start justify-between">
               <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <span class="material-symbols-outlined">account_balance_wallet</span>
               </div>
            </div>
            <div>
               <p class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Saldo Inicial</p>
               <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ status.startBalance | currency }}</h3>
               <p class="text-xs text-slate-400 mt-1" *ngIf="status.openingTime">Apertura: {{ status.openingTime | date: 'shortTime' }}</p>
            </div>
         </div>

         <!--Ingresos-->
         <div class="bg-white dark:bg-card-dark rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div class="flex items-start justify-between">
               <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <span class="material-symbols-outlined">arrow_downward</span>
               </div>
               <div class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                  <span class="material-symbols-outlined text-sm">trending_up</span>
                  + 15%
               </div>
            </div>
            <div>
               <p class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Ingresos</p>
               <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ summary.income | currency }}</h3>
               <p class="text-xs text-slate-400 mt-1">Hoy</p>
            </div>
         </div>

         <!--Egresos-->
         <div class="bg-white dark:bg-card-dark rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div class="flex items-start justify-between">
               <div class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <span class="material-symbols-outlined">arrow_upward</span>
               </div>
               <div class="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                  <span class="material-symbols-outlined text-sm">trending_down</span>
                  - 2%
               </div>
            </div>
            <div>
               <p class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Egresos</p>
               <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ summary.expense | currency }}</h3>
               <p class="text-xs text-slate-400 mt-1">Hoy</p>
            </div>
         </div>

         <!--Saldo Actual-->
         <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg shadow-slate-900/20 flex flex-col gap-4 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors"></div>
            <div class="flex items-start justify-between relative z-10">
               <div class="p-3 rounded-xl bg-white/10 text-primary">
                  <span class="material-symbols-outlined">savings</span>
               </div>
            </div>
            <div class="relative z-10">
               <p class="text-slate-400 text-xs font-bold uppercase tracking-wider">Saldo Actual</p>
               <h3 class="text-3xl font-bold text-white mt-1">{{ status.currentBalance | currency }}</h3>
               <p class="text-xs text-slate-500 mt-1">Disponible en caja física</p>
            </div>
         </div>
      </div>

      <!--Movements Section-->
      <div class="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
         <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Movimientos del Día</h3>
            <div class="flex gap-2">
               <button class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <span class="material-symbols-outlined">filter_list</span>
               </button>
               <button (click)="generateDailyReport()" class="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Exportar del Día">
                  <span class="material-symbols-outlined">download</span>
               </button>
            </div>
         </div>

         <div class="overflow-x-auto">
            <table class="w-full">
               <thead>
                  <tr class="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800">
                     <th class="text-left py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hora</th>
                     <th class="text-left py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</th>
                     <th class="text-left py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Método</th>
                     <th class="text-right py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr *ngFor="let movement of movements" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                     <td class="py-4 px-6">
                        <div class="flex flex-col">
                           <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ movement.date | date: 'shortTime' }}</span>
                        </div>
                     </td>
                     <td class="py-4 px-6">
                        <div class="flex flex-col gap-0.5">
                           <span class="text-sm font-bold text-slate-900 dark:text-white">{{ movement.description }}</span>
                           <span class="text-xs text-slate-400 font-medium" *ngIf="movement.referenceId">Ref: {{ movement.referenceId }}</span>
                        </div>
                     </td>
                     <td class="py-4 px-6">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                           {{ paymentMethodsMap[movement.paymentMethod] || movement.paymentMethod }}
                        </span>
                     </td>
                     <td class="py-4 px-6 text-right">
<span class="text-sm font-bold" [ngClass]="{'text-emerald-600 dark:text-emerald-400': movement.type === types.INCOME, 'text-red-600 dark:text-red-400': movement.type === types.EXPENSE, 'text-blue-600': movement.type === types.OPENING || movement.type === types.CLOSING}">
   {{ movement.type === types.INCOME || movement.type === types.OPENING ? '+' : '' }}{{ movement.type === types.EXPENSE ? '-' : '' }}{{ movement.amount | currency }}
</span>
<span *ngIf="movement.type === types.OPENING" class="text-xs ml-1 text-slate-400">(Apertura)</span>
<span *ngIf="movement.type === types.CLOSING" class="text-xs ml-1 text-slate-400">(Cierre)</span>
                     </td>
                  </tr>
                  <tr *ngIf="movements.length === 0">
                     <td colspan="4" class="py-8 text-center">
                        <div class="flex flex-col items-center gap-2">
                           <span class="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                           <p class="text-slate-500 font-medium">No hay movimientos registrados hoy</p>
                        </div>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>

         <!--Pagination-->
         <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Mostrando {{ movements.length }} movimientos</p>
            <div class="flex gap-2">
               <button class="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50" disabled>Anterior</button>
               <button class="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5" disabled>Siguiente</button>
            </div>
         </div>
      </div>

       <!--Inf Footer Removed-->

      <!--Modals-->
      <app-cash-movement-form *ngIf="showModal"
         (saved)="onSaved()"
         (cancel)="showModal = false">
      </app-cash-movement-form>

      <app-cash-history-modal *ngIf="showHistory"
         (close)="showHistory = false">
      </app-cash-history-modal>

      <app-cash-open-modal *ngIf="showOpenModal"
         (saved)="onOpenCashSaved()"
         (cancel)="showOpenModal = false">
      </app-cash-open-modal>

      <app-cash-close-modal *ngIf="showCloseModal"
         (closed)="onCloseCashSaved()"
         (cancel)="showCloseModal = false">
      </app-cash-close-modal>
   </div>
   `
})
export class CashDashboardComponent implements OnInit {
   types = CashMovementType;
   currentDate = new Date();
   summary: DailySummary = { income: 0, expense: 0, balance: 0 };
   status: CashStatus = {
      isOpen: false,
      isClosed: false,
      startBalance: 0,
      currentBalance: 0,
      income: 0,
      expense: 0
   };
   movements: CashMovement[] = [];
   showModal = false;
   showHistory = false;
   showOpenModal = false;
   showCloseModal = false;

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
      this.loadData();
   }

   onDateChange(dateStr: string) {
      this.currentDate = new Date(dateStr + 'T12:00:00');
      this.loadData();
   }

   loadData() {
      const dateStr = this.currentDate.toISOString().split('T')[0];

      this.cashService.getDailySummary(dateStr).subscribe(summary => {
         this.summary = summary;
      });

      this.cashService.findAll(dateStr).subscribe(movements => {
         this.movements = movements;
      });

      this.cashService.getStatus(dateStr).subscribe(status => {
         this.status = status;
      });
   }

   openModal() {
      if (!this.status.isOpen) {
         alert('Debe abrir la caja primero');
         return;
      }
      this.showModal = true;
   }

   onSaved() {
      this.showModal = false;
      this.loadData();
   }

   onOpenCashSaved() {
      this.showOpenModal = false;
      this.loadData();
   }

   openCash() {
      this.showOpenModal = true;
   }

   onCloseCashSaved() {
      this.showCloseModal = false;
      this.loadData();
   }

   closeCash() {
      this.showCloseModal = true;
   }

   generateDailyReport() {
      this.configService.getConfigs().subscribe(configs => {
         const clinicInfo = {
            ...configs['clinic_info'],
            logoUrl: configs['clinicLogoUrl']
         };

         const reportData = {
            summary: this.summary,
            movements: this.movements.map(m => ({
               ...m,
               paymentMethod: this.paymentMethodsMap[m.paymentMethod] || m.paymentMethod
            })),
            status: this.status,
            date: this.currentDate,
            userName: this.authService.currentUser()?.name,
            openUser: this.status.openedBy
         };

         this.pdfService.generateCashReportPdf(reportData, clinicInfo);
      });
   }

   openHistory() {
      this.showHistory = true;
   }
}

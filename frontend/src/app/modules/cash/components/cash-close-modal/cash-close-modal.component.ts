import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashService, CashStatus } from '../../cash.service';
import { SystemConfigService } from '../../../configuration/system-config.service';

@Component({
    selector: 'app-cash-close-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300" (click)="onCancel()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col transition-transform duration-300 transform scale-100 opacity-100" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
          <h3 class="text-slate-900 dark:text-white font-bold text-xl">Cierre de Caja</h3>
          <button class="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors" (click)="onCancel()">
             <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 bg-white dark:bg-slate-900 flex flex-col gap-6">
           
           <div class="flex flex-col gap-2">
              <p class="text-slate-500 dark:text-slate-400 text-sm">Resumen de cierre del día. Verifique los montos antes de confirmar.</p>
           </div>

           <div *ngIf="loadingStatus" class="flex justify-center py-4">
              <span class="material-symbols-outlined animate-spin text-slate-400">refresh</span>
           </div>

           <div *ngIf="!loadingStatus && status" class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
              <div class="flex justify-between items-center text-sm">
                 <span class="text-slate-500 dark:text-slate-400">Saldo Inicial</span>
                 <span class="font-bold text-slate-700 dark:text-slate-300">{{ currency }} {{ formatAmount(status.startBalance) }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                 <span class="text-emerald-600 dark:text-emerald-400">Total Ingresos</span>
                 <span class="font-bold text-emerald-600 dark:text-emerald-400">+ {{ currency }} {{ formatAmount(status.income) }}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                 <span class="text-red-600 dark:text-red-400">Total Egresos</span>
                 <span class="font-bold text-red-600 dark:text-red-400">- {{ currency }} {{ formatAmount(status.expense) }}</span>
              </div>
              <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
              <div class="flex justify-between items-center">
                 <span class="text-slate-900 dark:text-white font-bold">Saldo Final</span>
                 <span class="text-xl font-bold text-slate-900 dark:text-white">{{ currency }} {{ formatAmount(status.currentBalance) }}</span>
              </div>
           </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex justify-end gap-3">
           <button type="button" (click)="onCancel()" class="py-2.5 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-sm font-bold transition-colors">
              Cancelar
           </button>
           <button type="button" (click)="onSubmit()" [disabled]="loading || loadingStatus" class="py-2.5 px-5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span class="material-symbols-outlined" *ngIf="!loading">lock</span>
              <span class="material-symbols-outlined animate-spin" *ngIf="loading">refresh</span>
              {{ loading ? 'Cerrando...' : 'Confirmar Cierre' }}
           </button>
        </div>

      </div>
    </div>
  `
})
export class CashCloseModalComponent implements OnInit {
    @Output() closed = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    loading = false;
    loadingStatus = true;
    status: CashStatus | null = null;
    currency = 'Gs.';

    private cashService = inject(CashService);
    private configService = inject(SystemConfigService);

    ngOnInit() {
        this.loadCurrency();
        this.loadStatus();
    }

    loadCurrency() {
        this.configService.getConfigs().subscribe(configs => {
            if (configs['billing_config'] && configs['billing_config'].currency) {
                this.currency = configs['billing_config'].currency;
            }
        });
    }

    loadStatus() {
        this.loadingStatus = true;
        const today = new Date().toISOString();
        this.cashService.getStatus(today).subscribe({
            next: (status) => {
                this.status = status;
                this.loadingStatus = false;
            },
            error: (err) => {
                console.error('Error loading status', err);
                this.loadingStatus = false;
            }
        });
    }

    formatAmount(amount: number): string {
        return amount.toLocaleString('es-PY');
    }

    onSubmit() {
        this.loading = true;

        this.cashService.closeCash().subscribe({
            next: () => {
                this.loading = false;
                this.closed.emit();
            },
            error: (err) => {
                this.loading = false;
                console.error('Error closing cash:', err);
                // Handle case where it might be already closed
                if (err.error && err.error.message === 'Caja ya cerrada hoy') {
                    alert('La caja ya se encuentra cerrada.');
                    this.closed.emit();
                } else {
                    alert('Error al cerrar la caja. Por favor intente nuevamente.');
                }
            }
        });
    }

    onCancel() {
        this.cancel.emit();
    }
}

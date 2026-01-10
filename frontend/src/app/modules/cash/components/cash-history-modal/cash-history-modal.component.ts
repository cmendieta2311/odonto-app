import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashService } from '../../cash.service';

@Component({
    selector: 'app-cash-history-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300" (click)="onClose()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between sticky top-0 z-10">
          <h3 class="text-slate-900 dark:text-white font-bold text-xl">Historial de Caja (Últimos 7 días)</h3>
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
                     <th class="px-6 py-3">Fecha</th>
                     <th class="px-6 py-3 text-right">Ingresos</th>
                     <th class="px-6 py-3 text-right">Egresos</th>
                     <th class="px-6 py-3 text-right">Balance Total</th>
                     <th class="px-6 py-3 text-center">Estado</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900/50">
                  <tr *ngFor="let day of history" class="hover:bg-slate-50 dark:hover:bg-white/5">
                     <td class="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{{ day.date | date:'fullDate' }}</td>
                     <td class="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">+{{ day.income | currency }}</td>
                     <td class="px-6 py-4 text-right text-red-600 dark:text-red-400 font-bold">-{{ day.expense | currency }}</td>
                     <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{{ day.finalBalance | currency }}</td>
                     <td class="px-6 py-4 text-center">
                        <span *ngIf="day.isClosed" class="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">Cerrado</span>
                        <span *ngIf="!day.isClosed" class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Abierto</span>
                     </td>
                  </tr>
                  <tr *ngIf="history.length === 0">
                     <td colspan="5" class="py-8 text-center text-slate-500">No hay historial disponible</td>
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
    @Output() close = new EventEmitter<void>();
    history: any[] = [];

    constructor(private cashService: CashService) { }

    ngOnInit() {
        this.cashService.getHistory().subscribe(data => {
            this.history = data;
        });
    }

    onClose() {
        this.close.emit();
    }
}

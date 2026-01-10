import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CashService } from '../../cash.service';
import { SystemConfigService } from '../../../configuration/system-config.service';

@Component({
    selector: 'app-cash-open-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300" (click)="onCancel()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col transition-transform duration-300 transform scale-100 opacity-100" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
          <h3 class="text-slate-900 dark:text-white font-bold text-xl">Apertura de Caja</h3>
          <button class="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors" (click)="onCancel()">
             <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 bg-white dark:bg-slate-900">
           <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
              
              <div class="flex flex-col gap-2">
                 <p class="text-slate-500 dark:text-slate-400 text-sm">Ingrese el dinero efectivo inicial disponible en caja para comenzar el turno.</p>
              </div>

              <!-- Amount -->
              <label class="flex flex-col gap-2">
                 <span class="text-slate-700 dark:text-slate-300 text-sm font-bold">Monto Inicial</span>
                 <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <span class="text-slate-500 font-bold">{{ currency }}&nbsp;</span>
                    </div>
                    <input formControlName="amountDisplay" (input)="onAmountInput($event)" class="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium" placeholder="0" type="text" autofocus/>
                 </div>
                 <span *ngIf="form.get('amount')?.invalid && form.get('amount')?.touched" class="text-xs text-red-500 font-medium ml-1">
                    El monto es requerido.
                 </span>
              </label>

           </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex justify-end gap-3">
           <button type="button" (click)="onCancel()" class="py-2.5 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-sm font-bold transition-colors">
              Cancelar
           </button>
           <button type="button" (click)="onSubmit()" [disabled]="form.invalid || loading" class="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span class="material-symbols-outlined" *ngIf="!loading">lock_open</span>
              <span class="material-symbols-outlined animate-spin" *ngIf="loading">refresh</span>
              {{ loading ? 'Abriendo...' : 'Abrir Caja' }}
           </button>
        </div>

      </div>
    </div>
  `
})
export class CashOpenModalComponent implements OnInit {
    @Output() saved = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    form: FormGroup;
    loading = false;
    currency = 'Gs.'; // Default currency

    private configService = inject(SystemConfigService);

    constructor(
        private fb: FormBuilder,
        private cashService: CashService
    ) {
        this.form = this.fb.group({
            amount: [0, [Validators.required, Validators.min(0)]],
            amountDisplay: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.configService.getConfigs().subscribe(configs => {
            if (configs['billing_config'] && configs['billing_config'].currency) {
                this.currency = configs['billing_config'].currency;
            }
        });

        // Init display value
        this.form.get('amount')?.setValue(0);
        this.form.get('amountDisplay')?.setValue('0');
    }

    onAmountInput(event: any) {
        let value = event.target.value.replace(/\D/g, '');
        if (value === '') value = '0';

        const numberValue = parseInt(value, 10);
        this.form.get('amount')?.setValue(numberValue);

        // Format with thousands separator
        const formatted = numberValue.toLocaleString('es-PY'); // Using es-PY as default for Guarani like format or generic
        this.form.get('amountDisplay')?.setValue(formatted, { emitEvent: false });
    }

    onSubmit() {
        if (this.form.valid) {
            this.loading = true;
            const amount = this.form.get('amount')?.value;

            this.cashService.openCash(amount).subscribe({
                next: () => {
                    this.loading = false;
                    this.saved.emit();
                },
                error: (err) => {
                    this.loading = false;
                    console.error('Error opening cash:', err);

                    if (err.error && err.error.message === 'Caja ya abierta hoy') {
                        alert('La caja ya se encuentra abierta. Se actualizará el estado.');
                        this.saved.emit(); // Emit saved to trigger reload in parent
                    } else {
                        alert('Error al abrir la caja. Por favor intente nuevamente.');
                    }
                }
            });
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}

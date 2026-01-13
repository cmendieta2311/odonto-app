import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CashService, CashMovementType } from '../../cash.service';
import { PaymentMethodsService, PaymentMethod as PaymentMethodConfig } from '../../../configuration/payment-methods/payment-methods.service';

@Component({
   selector: 'app-cash-movement-form',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div class="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300" (click)="onCancel()">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transition-transform duration-300 transform scale-100 opacity-100" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between sticky top-0 z-10">
          <h3 class="text-slate-900 dark:text-white font-bold text-xl">Registrar Nuevo Movimiento</h3>
          <button class="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors" (click)="onCancel()">
             <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 flex flex-col gap-6 flex-1 bg-white dark:bg-slate-900">
           <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
              
              <!-- Type Toggle -->
              <div class="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                 <button type="button" 
                         (click)="setType(types.INCOME)"
                         class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
                         [ngClass]="form.get('type')?.value === types.INCOME ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'">
                    <span class="material-symbols-outlined text-lg">arrow_downward</span>
                    Ingreso
                 </button>
                 <button type="button" 
                         (click)="setType(types.EXPENSE)"
                         class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
                         [ngClass]="form.get('type')?.value === types.EXPENSE ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'">
                    <span class="material-symbols-outlined text-lg">arrow_upward</span>
                    Egreso
                 </button>
              </div>

              <!-- Description -->
              <label class="flex flex-col gap-2">
                 <span class="text-slate-700 dark:text-slate-300 text-sm font-bold">Descripción</span>
                 <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <span class="material-symbols-outlined text-slate-400">edit_note</span>
                    </div>
                    <input formControlName="description" class="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium" placeholder="Ej. Pago consulta, Compra insumos..." type="text"/>
                 </div>
              </label>

              <!-- Amount & Method -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <label class="flex flex-col gap-2">
                    <span class="text-slate-700 dark:text-slate-300 text-sm font-bold">Monto</span>
                    <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-slate-500 font-bold">₲</span>
                     </div>
                     <input formControlName="amount" (input)="formatAmount($event)" class="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium" placeholder="0" type="text"/>
                    </div>
                 </label>

                 <label class="flex flex-col gap-2">
                    <span class="text-slate-700 dark:text-slate-300 text-sm font-bold">Método de Pago</span>
                    <div class="relative">
                       <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none bg-transparent z-10">
                          <!-- Optional Icon for select -->
                       </div>
                       <select formControlName="paymentMethod" class="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium appearance-none">
                          <option *ngFor="let method of paymentMethods" [value]="method.code">{{ method.name }}</option>
                       </select>
                       <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span class="material-symbols-outlined text-slate-400">expand_more</span>
                       </div>
                    </div>
                 </label>
              </div>
           </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex justify-end gap-3 sticky bottom-0 z-10 rounded-b-2xl">
           <button type="button" (click)="onCancel()" class="py-2.5 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-sm font-bold transition-colors">
              Cancelar
           </button>
           <button type="button" (click)="onSubmit()" [disabled]="form.invalid || loading" class="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span class="material-symbols-outlined" *ngIf="!loading">save</span>
              <span class="material-symbols-outlined animate-spin" *ngIf="loading">refresh</span>
              {{ loading ? 'Guardando...' : 'Guardar Movimiento' }}
           </button>
        </div>

      </div>
    </div>
  `
})
export class CashMovementFormComponent implements OnInit {
   @Output() saved = new EventEmitter<void>();
   @Output() cancel = new EventEmitter<void>();

   form: FormGroup;
   loading = false;
   types = CashMovementType;
   paymentMethods: PaymentMethodConfig[] = [];

   constructor(
      private fb: FormBuilder,
      private cashService: CashService,
      private paymentMethodsService: PaymentMethodsService
   ) {
      this.form = this.fb.group({
         type: [CashMovementType.EXPENSE, Validators.required],
         amount: [null, [Validators.required, this.amountValidator]],
         description: ['', Validators.required],
         paymentMethod: ['CASH', Validators.required]
      });
   }

   amountValidator(control: AbstractControl) {
      if (!control.value) return null;
      const amount = parseInt(control.value.toString().replace(/\./g, ''), 10);
      return amount > 0 ? null : { min: true };
   }

   formatAmount(event: any) {
      const input = event.target;
      let value = input.value.replace(/\D/g, '');
      if (value) {
         value = parseInt(value, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
      this.form.get('amount')?.setValue(value);
   }

   ngOnInit() {
      this.paymentMethodsService.findAll().subscribe((methods: PaymentMethodConfig[]) => {
         this.paymentMethods = methods.filter(m => m.isActive);
      });
   }

   setType(type: CashMovementType) {
      this.form.patchValue({ type });
   }

   onSubmit() {
      if (this.form.valid) {
         this.loading = true;
         const formValue = {
            ...this.form.value,
            amount: parseInt(this.form.value.amount.toString().replace(/\./g, ''), 10)
         };
         this.cashService.create(formValue).subscribe({
            next: () => {
               this.loading = false;
               this.saved.emit();
               this.form.reset({ type: CashMovementType.EXPENSE, paymentMethod: 'CASH' });
            },
            error: () => {
               this.loading = false;
               // TODO: handle error
            }
         });
      }
   }

   onCancel() {
      this.cancel.emit();
   }
}

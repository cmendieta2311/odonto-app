import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Output, EventEmitter, TemplateRef } from '@angular/core';

export interface TableColumn {
    key: string;
    label: string;
    class?: string;
    headerClass?: string;
    hiddenOnMobile?: boolean;
}

@Component({
    selector: 'app-custom-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-[#dbe4e6] dark:border-[#2a3e42] shadow-sm overflow-hidden flex flex-col">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-background-light dark:bg-background-dark border-b border-[#dbe4e6] dark:border-[#2a3e42]">
              <th *ngFor="let col of columns" 
                  class="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark"
                  [ngClass]="[col.headerClass || '', col.hiddenOnMobile ? 'hidden sm:table-cell' : '']">
                {{col.label}}
              </th>
              <th *ngIf="hasActions" class="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#dbe4e6] dark:divide-[#2a3e42]">
            <tr *ngFor="let item of data" class="group hover:bg-primary/5 dark:hover:bg-primary/5 transition-colors">
              <td *ngFor="let col of columns" 
                  class="p-4"
                  [ngClass]="[col.class || '', col.hiddenOnMobile ? 'hidden sm:table-cell' : '']">
                <!-- Custom Template if provided -->
                <ng-container *ngIf="columnTemplates[col.key]; else defaultVal">
                  <ng-container *ngTemplateOutlet="columnTemplates[col.key]; context: { $implicit: item }"></ng-container>
                </ng-container>
                <ng-template #defaultVal>
                  <span class="text-sm text-text-main-light dark:text-text-main-dark">{{item[col.key]}}</span>
                </ng-template>
              </td>
              
              <!-- Actions -->
              <td *ngIf="hasActions" class="p-4 text-center">
                <div class="flex justify-center gap-2">
                  <button *ngIf="showEdit" class="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-primary/10 transition-colors" 
                          (click)="onEdit.emit(item)" title="Editar">
                    <span class="material-symbols-outlined" style="font-size: 20px;">edit</span>
                  </button>
                  <button *ngIf="showDelete" class="p-1.5 rounded-lg text-text-secondary-light hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                          (click)="onDelete.emit(item)" title="Eliminar">
                    <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                  </button>
                  <ng-container *ngIf="extraActionsTemplate">
                    <ng-container *ngTemplateOutlet="extraActionsTemplate; context: { $implicit: item }"></ng-container>
                  </ng-container>
                </div>
              </td>
            </tr>
            <tr *ngIf="data.length === 0">
              <td [attr.colspan]="columns.length + (hasActions ? 1 : 0)" class="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark italic text-sm">
                No hay datos para mostrar.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div *ngIf="showPagination" class="p-4 border-t border-[#dbe4e6] dark:border-[#2a3e42] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Mostrando <span class="font-bold text-text-main-light dark:text-text-main-dark">1-{{data.length}}</span> de <span class="font-bold text-text-main-light dark:text-text-main-dark">{{totalItems || data.length}}</span> resultados
        </span>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 rounded-lg border border-[#dbe4e6] dark:border-[#2a3e42] text-sm text-text-secondary-light dark:text-text-secondary-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-50" [disabled]="true">
            Anterior
          </button>
          <button class="size-8 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center">1</button>
          <button class="px-3 py-1.5 rounded-lg border border-[#dbe4e6] dark:border-[#2a3e42] text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class CustomTableComponent {
    @Input({ required: true }) columns: TableColumn[] = [];
    @Input({ required: true }) data: any[] = [];
    @Input() totalItems?: number;
    @Input() hasActions = true;
    @Input() showEdit = true;
    @Input() showDelete = true;
    @Input() showPagination = true;

    @Input() columnTemplates: { [key: string]: TemplateRef<any> } = {};
    @Input() extraActionsTemplate?: TemplateRef<any>;

    @Output() onEdit = new EventEmitter<any>();
    @Output() onDelete = new EventEmitter<any>();
}

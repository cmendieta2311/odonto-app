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
      <!-- Pagination -->
      <div *ngIf="showPagination && totalItems > 0" class="p-4 border-t border-[#dbe4e6] dark:border-[#2a3e42] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-xs text-text-secondary-light dark:text-text-secondary-dark">Ver:</label>
            <select 
              [value]="pageSize" 
              (change)="onPageSizeChange($event)"
              class="bg-background-light dark:bg-background-dark border border-[#dbe4e6] dark:border-[#2a3e42] text-text-main-light dark:text-text-main-dark text-xs rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-primary transition-colors">
              <option *ngFor="let size of pageSizeOptions" [value]="size" [selected]="size === pageSize">{{size}}</option>
            </select>
          </div>
          <span class="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span class="font-bold text-text-main-light dark:text-text-main-dark">{{startItemIndex}}-{{endItemIndex}}</span> de <span class="font-bold text-text-main-light dark:text-text-main-dark">{{totalItems}}</span> resultados
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            class="px-3 py-1.5 rounded-lg border border-[#dbe4e6] dark:border-[#2a3e42] text-sm text-text-secondary-light dark:text-text-secondary-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed" 
            [disabled]="page === 1"
            (click)="changePage(page - 1)">
            Anterior
          </button>
          <span class="text-sm font-medium px-2">Página {{page}} de {{totalPages}}</span>
          <button 
            class="px-3 py-1.5 rounded-lg border border-[#dbe4e6] dark:border-[#2a3e42] text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="page >= totalPages"
            (click)="changePage(page + 1)">
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
  @Input() totalItems = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() hasActions = true;
  @Input() showEdit = true;
  @Input() showDelete = true;
  @Input() showPagination = true;

  @Input() columnTemplates: { [key: string]: TemplateRef<any> } = {};
  @Input() extraActionsTemplate?: TemplateRef<any>;

  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();

  @Input() pageSizeOptions = [5, 10, 20, 50, 100];
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startItemIndex(): number {
    return (this.page - 1) * this.pageSize + 1;
  }

  get endItemIndex(): number {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.pageChange.emit(newPage);
    }
  }

  onPageSizeChange(event: Event) {
    const newSize = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(newSize);
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Service } from '../../catalog/catalog.models';

@Component({
    selector: 'app-service-catalog-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-[800px] max-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div>
                <h2 class="text-xl font-bold text-slate-800 dark:text-white">Catálogo de Servicios</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Seleccione un servicio para agregar al presupuesto</p>
            </div>
            <button (click)="close()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <!-- Search -->
        <div class="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/50">
            <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
                <input [formControl]="searchControl" 
                       type="text" 
                       placeholder="Buscar por nombre, código o categoría..." 
                       class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 dark:text-white placeholder:text-slate-400">
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <!-- Categories Loop -->
            <div *ngFor="let group of filteredGroups" class="mb-6 last:mb-0">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                    {{group.label}}
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button *ngFor="let service of group.items" 
                            (click)="select(service)"
                            class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/5 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-left group">
                        <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <span class="text-xs font-bold">{{service.code}}</span>
                        </div>
                        <div>
                            <p class="font-bold text-slate-700 dark:text-white text-sm group-hover:text-primary transition-colors line-clamp-1">{{service.name}}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{{service.price | currency}}</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="filteredGroups.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                <p>No se encontraron servicios que coincidan con la búsqueda.</p>
            </div>
        </div>
    </div>
  `
})
export class ServiceCatalogDialogComponent implements OnInit {
    searchControl = new FormControl('');
    services: Service[] = [];
    filteredGroups: { label: string, items: Service[] }[] = [];

    constructor(
        public dialogRef: DialogRef<Service>,
        @Inject(DIALOG_DATA) public data: { services: Service[] }
    ) {
        this.services = data.services || [];
    }

    ngOnInit() {
        this.filterServices('');
        this.searchControl.valueChanges.subscribe(val => {
            this.filterServices(val || '');
        });
    }

    filterServices(query: string) {
        const lowerQuery = query.toLowerCase();

        // Filter services
        const filtered = this.services.filter(s =>
            s.active && (
                s.name.toLowerCase().includes(lowerQuery) ||
                s.code.toLowerCase().includes(lowerQuery) ||
                s.category?.name.toLowerCase().includes(lowerQuery)
            )
        );

        // Group them
        const groups = new Map<string, Service[]>();
        filtered.forEach(service => {
            const areaName = service.category?.area?.name || 'Otras Areas';
            const categoryName = service.category?.name || 'General';
            const groupKey = `${areaName} > ${categoryName}`;

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)?.push(service);
        });

        this.filteredGroups = Array.from(groups.entries())
            .map(([label, items]) => ({ label, items }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    close() {
        this.dialogRef.close();
    }

    select(service: Service) {
        this.dialogRef.close(service);
    }
}

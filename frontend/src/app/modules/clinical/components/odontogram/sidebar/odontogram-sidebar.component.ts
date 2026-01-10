import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToothSurfaceStatus } from '../tooth/tooth.component';

@Component({
    selector: 'app-odontogram-sidebar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex flex-col gap-6 h-full">
        <section class="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-teal-600 filled">dentistry</span>
                    Detalle del Diente
                </h3>
                <span *ngIf="selectedTooth" class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded">
                    {{ selectedTooth }}
                </span>
            </div>
            
            <div *ngIf="!selectedTooth" class="p-8 text-center text-slate-400 text-sm">
                <span class="material-symbols-outlined text-4xl mb-2 opacity-50">touch_app</span>
                <p>Seleccione un diente para ver detalles</p>
            </div>

            <div *ngIf="selectedTooth" class="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div class="flex gap-4 mb-4">
                    <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <!-- Simplified Tooth SVG Placeholder -->
                         <svg class="w-12 h-12" viewBox="0 0 100 100">
                            <path class="fill-white dark:fill-card-dark stroke-slate-300 dark:stroke-slate-600" d="M0,0 L100,0 L80,20 L20,20 Z"></path>
                            <path class="fill-white dark:fill-card-dark stroke-slate-300 dark:stroke-slate-600" d="M100,0 L100,100 L80,80 L80,20 Z"></path>
                            <path class="fill-white dark:fill-card-dark stroke-slate-300 dark:stroke-slate-600" d="M100,100 L0,100 L20,80 L80,80 Z"></path>
                            <path class="fill-white dark:fill-card-dark stroke-slate-300 dark:stroke-slate-600" d="M0,100 L0,0 L20,20 L20,80 Z"></path>
                            <rect class="fill-white dark:fill-card-dark stroke-slate-300 dark:stroke-slate-600" height="60" width="60" x="20" y="20"></rect>
                            <text x="50" y="55" font-size="20" text-anchor="middle" fill="#94a3b8" font-weight="bold">{{ selectedTooth }}</text>
                        </svg>
                    </div>
                    <div class="flex flex-col justify-center">
                        <p class="text-sm font-bold text-slate-900 dark:text-white">Diente #{{ selectedTooth }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Estado: 
                            <span *ngIf="hasStatus(selectedTooth)" class="text-blue-600 font-medium capitalized">
                                {{ getToothStatuses(selectedTooth).join(', ') }}
                            </span>
                            <span *ngIf="!hasStatus(selectedTooth)" class="text-slate-400 italic">Sano / Sin registro</span>
                        </p>
                    </div>
                </div>

                <label class="block mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones Rápidas</label>
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <button class="flex items-center justify-center gap-1 py-2 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                        <span class="material-symbols-outlined text-[16px]">add_a_photo</span> Foto
                    </button>
                    <button class="flex items-center justify-center gap-1 py-2 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                        <span class="material-symbols-outlined text-[16px]">history</span> Historial
                    </button>
                </div>

                <div class="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded p-3">
                    <p class="text-xs text-slate-600 dark:text-slate-400">
                        <span class="font-bold text-yellow-700 dark:text-yellow-500">Nota:</span>
                        Sin observaciones recientes.
                    </p>
                </div>
            </div>
        </section>

        <!-- Treatments List -->
        <section class="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Tratamientos</h3>
                <button class="text-teal-600 text-sm font-medium hover:underline">Ver Todo</button>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                 <ng-container *ngFor="let item of treatments">
                     <div class="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <!-- Icon/Tooth Indicator -->
                        <div class="size-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0 text-xs font-bold text-slate-500">
                            {{ item.toothNumber || '#' }}
                        </div>

                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start mb-0.5">
                                <p class="text-sm font-bold text-slate-900 dark:text-white truncate pr-2" title="{{ getRecordTitle(item) }}">
                                    {{ getRecordTitle(item) }}
                                </p>
                                <p class="text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                                    {{ formatDate(item.date) }}
                                </p>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <p class="text-xs text-slate-500 truncate">
                                    {{ item.surface ? 'Cara ' + item.surface : 'Diente Completo' }}
                                </p>
                                <!-- Status Badge -->
                                <span [class]="'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ' + getRecordStatusColor(item)">
                                    {{ getRecordStatus(item) }}
                                </span>
                            </div>
                        </div>

                        <!-- Delete Action -->
                        <button (click)="onDelete(item)" class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100" title="Eliminar registro">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                     </div>
                 </ng-container>

                <div *ngIf="treatments.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                     <span class="material-symbols-outlined text-4xl mb-2 opacity-50">history_edu</span>
                    <p class="text-xs">No hay tratamientos registrados</p>
                </div>
            </div>
            
             <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 mt-auto shrink-0">
                <button class="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/20">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                    Agregar Tratamiento
                </button>
            </div>
        </section>

        <!-- Notes Section -->
        <section class="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 shrink-0">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase">Notas del Odontograma</h3>
            <textarea class="w-full text-xs rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500 resize-none p-2" placeholder="Escriba notas generales aquí..." rows="2"></textarea>
        </section>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded-full; }
  `]
})
export class OdontogramSidebarComponent {
    @Input() selectedTooth: number | null = null;
    @Input() teethStatus: { [key: number]: ToothSurfaceStatus } = {};
    @Input() treatments: any[] = []; // ServicePerformed[]
    @Output() deleteRecord = new EventEmitter<any>();

    hasStatus(tooth: number): boolean {
        const statuses = this.teethStatus[tooth];
        if (!statuses) return false;
        return Object.values(statuses).some(s => s);
    }

    onDelete(record: any) {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            this.deleteRecord.emit(record);
        }
    }

    getToothStatuses(tooth: number): string[] {
        const statuses = this.teethStatus[tooth];
        if (!statuses) return [];
        // Extract unique status values
        const values = Object.values(statuses).filter(s => s) as string[];
        return [...new Set(values)];
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'caries': return 'bg-red-100 text-red-700 border border-red-200';
            case 'restoration': return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'extraction': return 'bg-slate-100 text-slate-700 border border-slate-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    getRecordTitle(record: any): string {
        // Simple logic to extract a title from the record
        if (record.service?.name) return record.service.name;
        if (record.notes) return record.notes;
        return 'Procedimiento registrado';
    }

    getRecordColor(record: any): string {
        const notes = record.notes?.toLowerCase() || '';
        if (notes.includes('caries')) return 'bg-red-500';
        if (notes.includes('restauración') || notes.includes('curación')) return 'bg-blue-500';
        if (notes.includes('extracc')) return 'bg-slate-800';
        return 'bg-teal-500';
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    getRecordStatus(record: any): string {
        const notes = (record.notes?.toLowerCase() || '') + (record.service?.name?.toLowerCase() || '');

        if (notes.includes('caries')) return 'Diagnóstico';
        if (notes.includes('restauración') || notes.includes('curación') || notes.includes('resina')) return 'Tratamiento';
        if (notes.includes('extracc')) return 'Procedimiento';

        return 'Registrado';
    }

    getRecordStatusColor(record: any): string {
        const status = this.getRecordStatus(record);

        switch (status) {
            case 'Diagnóstico':
                return 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'Tratamiento':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'Procedimiento':
                return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            default:
                return 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
        }
    }
}

import { Component, Input, OnInit, inject, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToothComponent, ToothSurfaceStatus } from './tooth/tooth.component';
import { ClinicalService, CreateClinicalDto, ServicePerformed } from '../../clinical.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type ToolType = 'select' | 'caries' | 'restoration' | 'extraction';

@Component({
    selector: 'app-odontogram',
    standalone: true,
    imports: [CommonModule, ToothComponent, MatSnackBarModule],
    templateUrl: './odontogram.html',
    styles: [`
        .tool-btn {
            @apply p-2 rounded-lg border flex flex-col items-center gap-1 transition-all min-w-[80px];
        }
        .tool-btn.active {
            @apply bg-primary/10 border-primary text-primary font-bold shadow-sm;
        }
        .tool-btn:not(.active) {
            @apply border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500;
        }
    `]
})
export class OdontogramComponent implements OnInit, OnChanges {
    @Input() patientId: string = '';

    @Output() toothSelected = new EventEmitter<number>();
    @Output() recordsChange = new EventEmitter<ServicePerformed[]>();

    // Services
    private clinicalService = inject(ClinicalService);
    private snackBar = inject(MatSnackBar);

    // State
    activeTool: ToolType = 'select';
    isChildDentition = false;
    teethStatus: { [key: number]: ToothSurfaceStatus } = {};
    isLoading = false;
    clinicalRecords: ServicePerformed[] = [];

    // Dentition Maps
    adultTeeth = [
        { quadrant: 1, teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
        { quadrant: 2, teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
        { quadrant: 4, teeth: [48, 47, 46, 45, 44, 43, 42, 41] },
        { quadrant: 3, teeth: [31, 32, 33, 34, 35, 36, 37, 38] }
    ];

    childTeeth = [
        { quadrant: 5, teeth: [55, 54, 53, 52, 51] },
        { quadrant: 6, teeth: [61, 62, 63, 64, 65] },
        { quadrant: 8, teeth: [85, 84, 83, 82, 81] },
        { quadrant: 7, teeth: [71, 72, 73, 74, 75] }
    ];

    ngOnInit() {
        if (this.patientId) {
            this.loadClinicalData();
        }
    }

    ngOnChanges(changes: import('@angular/core').SimpleChanges) {
        if (changes['patientId'] && !changes['patientId'].firstChange && this.patientId) {
            this.loadClinicalData();
        }
    }

    loadClinicalData() {
        this.isLoading = true;
        this.clinicalService.getHistory(this.patientId).subscribe({
            next: (records) => {
                this.processRecords(records);
                this.isLoading = false;
            },
            error: () => this.isLoading = false
        });
    }

    processRecords(records: ServicePerformed[]) {
        this.clinicalRecords = records;
        this.recordsChange.emit(this.clinicalRecords);

        // Reset local state
        const newStatus: { [key: number]: ToothSurfaceStatus } = {};

        records.forEach(record => {
            // Handle potential camelCase/snake_case mismatch
            const toothNum = record.toothNumber || (record as any).tooth_number;

            if (toothNum && record.surface) {
                let status = 'restoration'; // Default
                if (record.notes?.toLowerCase().includes('caries')) {
                    status = 'caries';
                }
                if (record.notes?.toLowerCase().includes('extracc')) {
                    status = 'extraction';
                }

                // Update the temp object
                if (!newStatus[toothNum]) {
                    newStatus[toothNum] = {};
                }

                const surface = record.surface;
                if (surface === 'full') {
                    newStatus[toothNum] = {
                        vestibular: status,
                        lingual: status,
                        mesial: status,
                        distal: status,
                        occlusal: status
                    };
                } else {
                    newStatus[toothNum][surface as keyof ToothSurfaceStatus] = status;
                }
            }
        });

        // Assign new reference to trigger CD
        this.teethStatus = newStatus;
    }

    updateLocalState(tooth: number, surface: string, status: string) {
        // Create shallow copy of current state to ensure CD triggers
        const currentToothStatus = { ...(this.teethStatus[tooth] || {}) };

        if (surface === 'full') {
            currentToothStatus.vestibular = status;
            currentToothStatus.lingual = status;
            currentToothStatus.mesial = status;
            currentToothStatus.distal = status;
            currentToothStatus.occlusal = status;
        } else {
            currentToothStatus[surface as keyof ToothSurfaceStatus] = status;
        }

        // Update main map with new tooth status reference
        this.teethStatus = {
            ...this.teethStatus,
            [tooth]: currentToothStatus
        };
    }

    onSurfaceClick(tooth: number, surface: string) {
        this.toothSelected.emit(tooth);

        if (this.activeTool === 'select') return;

        const previousStatus = this.teethStatus[tooth]?.[surface as keyof ToothSurfaceStatus];
        this.updateLocalState(tooth, surface, this.activeTool);

        // Valid Service ID fetched from DB (ODO001 - Resina Simple Anterior)
        const placeholderServiceId = '53ca96d0-470d-483a-a6df-1c8a3f5d249c';

        const payload: CreateClinicalDto = {
            patientId: this.patientId,
            serviceId: placeholderServiceId,
            toothNumber: tooth,
            surface: surface,
            notes: `Auto-generated: ${this.activeTool}`
        };

        this.clinicalService.createRecord(payload).subscribe({
            next: (newRecord) => {
                this.snackBar.open('Registro guardado', 'Ok', { duration: 1000 });
                // Optimistic update confirmation
                // If backend returns the record, ensure we handle its casing too if needed, 
                // but usually create returns strictly typed DTO
                this.clinicalRecords = [...this.clinicalRecords, newRecord];
                this.recordsChange.emit(this.clinicalRecords);
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al guardar', 'Reintentar', { duration: 3000 });
                // Revert on error
                if (previousStatus) {
                    this.updateLocalState(tooth, surface, previousStatus);
                } else {
                    // If it was empty, we need to remove the status. 
                    // Simplified revert: just reload or set to undefined
                    // For now, reload data is safest to ensure consistency
                    this.loadClinicalData();
                }
            }
        });
    }

    setTool(tool: ToolType) {
        this.activeTool = tool;
    }

    toggleDentition() {
        this.isChildDentition = !this.isChildDentition;
    }
}

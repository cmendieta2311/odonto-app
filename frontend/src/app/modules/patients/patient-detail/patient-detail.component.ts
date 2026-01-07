import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientsService } from '../patients.service';
import { Patient } from '../patients.models';
import { OdontogramComponent } from '../../clinical/components/odontogram/odontogram.component';
import { OdontogramSidebarComponent } from '../../clinical/components/odontogram/sidebar/odontogram-sidebar.component';
import { ClinicalHistoryComponent } from '../../clinical/components/clinical-history/clinical-history.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, MatSnackBarModule, OdontogramComponent, OdontogramSidebarComponent, ClinicalHistoryComponent],
    templateUrl: './patient-detail.html',
    styles: [`
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }

        /* Icon utilities */
        .material-symbols-outlined.filled {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
    `]
})
export class PatientDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private patientsService = inject(PatientsService);
    private snackBar = inject(MatSnackBar);
    private fb = inject(FormBuilder);

    patientId: string | null = null;
    patient: Patient | null = null;
    isLoading = true;
    activeTab: 'summary' | 'odontogram' | 'history' | 'financial' | 'files' = 'summary';

    selectedTooth: number | null = null;
    clinicalRecords: any[] = [];
    selectedToothTreatments: any[] = [];

    onToothSelected(tooth: number) {
        this.selectedTooth = tooth;
        this.filterTreatments();
    }

    onRecordsChange(records: any[]) {
        this.clinicalRecords = records;
        this.filterTreatments();
    }

    private filterTreatments() {
        if (this.selectedTooth) {
            this.selectedToothTreatments = this.clinicalRecords.filter(r => r.toothNumber === this.selectedTooth);
        } else {
            this.selectedToothTreatments = [];
        }
    }

    // Edit Mode State
    isEditing = false;
    patientForm: FormGroup;

    constructor() {
        this.patientForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            dni: ['', Validators.required],
            email: ['', [Validators.email]],
            phone: [''],
            address: [''],
            // New fields
            birthDate: [''],
            gender: [''],
            civilStatus: [''],
            city: [''],
            postalCode: ['']
        });
    }

    ngOnInit() {
        this.patientId = this.route.snapshot.paramMap.get('id');
        if (this.patientId) {
            this.loadPatient(this.patientId);
        } else {
            this.router.navigate(['/reception/patients']);
        }
    }

    loadPatient(id: string) {
        this.isLoading = true;
        this.patientsService.getPatient(id).subscribe({
            next: (data) => {
                this.patient = data;
                this.initForm(data);
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al cargar datos del paciente', 'Cerrar', { duration: 3000 });
                this.router.navigate(['/reception/patients']);
            }
        });
    }

    private initForm(patient: Patient) {
        this.patientForm.patchValue({
            firstName: patient.firstName,
            lastName: patient.lastName,
            dni: patient.dni,
            email: patient.email || '',
            phone: patient.phone || '',
            address: patient.address || '',
            birthDate: patient.birthDate || '',
            gender: patient.gender || 'M', // default or empty
            civilStatus: patient.civilStatus || 'Soltero/a', // default
            city: patient.city || 'Madrid', // Mock default based on image
            postalCode: patient.postalCode || ''
        });
        this.patientForm.disable(); // Start disabled
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.patientForm.enable();
        } else {
            this.patientForm.disable();
            // Reset to original data if cancelling
            if (this.patient) {
                this.initForm(this.patient);
            }
        }
    }

    saveChanges() {
        if (this.patientForm.invalid) return;

        const formValue = this.patientForm.getRawValue();
        // Here we would call the service to update.
        // For now, we simulate update in UI.

        // Merge form values back into local patient object to reflect changes immediately
        this.patient = { ...this.patient!, ...formValue };

        this.isEditing = false;
        this.patientForm.disable();
        this.snackBar.open('Ficha actualizada correctamente', 'Cerrar', { duration: 3000 });

        // TODO: Call actual update endpoint
        // this.patientsService.updatePatient(this.patientId!, formValue).subscribe(...)
    }

    editPatient() {
        // Legacy method, now mapped to toggleEditMode if used for full edit
        this.toggleEditMode();
    }

    calculateAge(dob?: string | Date): string {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return `${age} años`;
    }

    setActiveTab(tab: typeof this.activeTab) {
        this.activeTab = tab;
    }
}

import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PatientsService } from '../patients.service';
import { ClinicalService } from '../../clinical/clinical.service';
import { Patient } from '../patients.models';
import { OdontogramComponent } from '../../clinical/components/odontogram/odontogram.component';
import { OdontogramSidebarComponent } from '../../clinical/components/odontogram/sidebar/odontogram-sidebar.component';
import { ClinicalHistoryComponent } from '../../clinical/components/clinical-history/clinical-history.component';
import { InvoiceListComponent } from '../../invoices/invoice-list/invoice-list';
import { PaymentListComponent } from '../../payments/payment-list/payment-list';
import { PatientFilesComponent } from '../components/patient-files/patient-files.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
    selector: 'app-patient-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule,
        OdontogramComponent, OdontogramSidebarComponent, ClinicalHistoryComponent,
        InvoiceListComponent, PaymentListComponent, PatientFilesComponent],
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
    // Services
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private patientsService = inject(PatientsService);
    private clinicalService = inject(ClinicalService); // Inject ClinicalService
    private notificationService = inject(NotificationService);
    private fb = inject(FormBuilder);

    patientId: string | null = null;
    patient: Patient | null = null;
    isLoading = true;
    activeTab: 'summary' | 'odontogram' | 'history' | 'financial' | 'files' = 'summary';

    @ViewChild(OdontogramComponent) odontogramComponent!: OdontogramComponent;

    selectedTooth: number | null = null;
    clinicalRecords: any[] = [];
    selectedToothTreatments: any[] = [];
    currentTeethStatus: { [key: number]: any } = {};

    onToothSelected(tooth: number) {
        this.selectedTooth = tooth;
        this.filterTreatments();
    }

    onRecordsChange(records: any[]) {
        this.clinicalRecords = records;
        this.filterTreatments();
    }

    onTeethStatusChange(status: { [key: number]: any }) {
        this.currentTeethStatus = status;
    }

    onDeleteRecord(record: any) {
        this.isLoading = true;
        this.clinicalService.deleteRecord(record.id).subscribe({
            next: () => {
                this.notificationService.showSuccess('Registro eliminado correctamente');
                // Refresh Odontogram data
                if (this.odontogramComponent) {
                    this.odontogramComponent.loadClinicalData();
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.notificationService.showError('Error al eliminar el registro');
                this.isLoading = false;
            }
        });
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
                this.notificationService.showError('Error al cargar datos del paciente');
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
        this.isLoading = true; // Show loading state

        this.patientsService.updatePatient(this.patientId!, formValue).subscribe({
            next: (updatedPatient) => {
                this.patient = updatedPatient;
                this.isEditing = false;
                this.patientForm.disable();
                this.notificationService.showSuccess('Ficha actualizada correctamente');
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.notificationService.showError('Error al actualizar la ficha');
                this.isLoading = false;
            }
        });
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

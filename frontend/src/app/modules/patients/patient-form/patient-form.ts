import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { PatientsService } from '../patients.service';
import { DocumentTypesService, DocumentType } from '../../configuration/document-types.service';
import { Patient } from '../patients.models';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
    selector: 'app-patient-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './patient-form.html',
    styleUrl: './patient-form.css'
})
export class PatientFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private patientsService = inject(PatientsService);
    private docTypesService = inject(DocumentTypesService);
    private notificationService = inject(NotificationService);

    isEditMode = false;
    patientId: string | null = null;
    isSaving = false;
    documentTypes: DocumentType[] = [];

    form: FormGroup;

    constructor() {
        this.form = this.fb.group({
            documentTypeId: ['', Validators.required],
            dni: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.email]],
            phone: [''],
            address: [''],
            history: ['']
        });
    }

    ngOnInit() {
        // console.log('PatientFormComponent initialized. ID:', this.patientId);
        this.loadDocumentTypes();

        this.patientId = this.route.snapshot.paramMap.get('id');
        console.log('PatientFormComponent initialized. ID:', this.patientId);

        if (this.patientId) {
            this.isEditMode = true;
            this.loadPatient(this.patientId);
        }
    }

    loadDocumentTypes() {
        this.docTypesService.getDocumentTypes().subscribe({
            next: (types) => this.documentTypes = types,
            error: () => this.notificationService.showError('Error al cargar tipos de documento')
        });
    }

    loadPatient(id: string) {
        console.log('Loading patient:', id);
        this.patientsService.getPatient(id).subscribe({
            next: (patient) => {
                console.log('Patient loaded:', patient);
                try {
                    this.form.patchValue(patient);
                } catch (e) {
                    console.error('Error patching form:', e);
                }
            },
            error: (err) => {
                console.error('Error loading patient:', err);
                this.notificationService.showError('Error al cargar paciente');
                this.router.navigate(['/reception/patients']);
            }
        });
    }

    save() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const formValue = this.form.value;

        // Sanitize payload: convertible empty strings to undefined/null
        const payload = {
            ...formValue,
            email: formValue.email || undefined,
            phone: formValue.phone || undefined,
            address: formValue.address || undefined,
            history: formValue.history || undefined
        };

        const action = this.isEditMode && this.patientId
            ? this.patientsService.updatePatient(this.patientId, payload)
            : this.patientsService.createPatient(payload);

        action.subscribe({
            next: () => {
                this.notificationService.showSuccess('Paciente guardado exitosamente');
                this.router.navigate(['/reception/patients']);
            },
            error: (err) => {
                console.error(err);
                this.notificationService.showError('Error al guardar paciente');
                this.isSaving = false;
            }
        });
    }

    cancel() {
        this.router.navigate(['/reception/patients']);
    }
}

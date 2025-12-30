import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PatientsService } from '../patients.service';
import { DocumentTypesService, DocumentType } from '../../configuration/document-types.service';
import { Patient } from '../patients.models';

@Component({
    selector: 'app-patient-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
    templateUrl: './patient-form.html',
    styleUrl: './patient-form.css'
})
export class PatientFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private patientsService = inject(PatientsService);
    private docTypesService = inject(DocumentTypesService);
    private snackBar = inject(MatSnackBar);

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
        this.loadDocumentTypes();

        this.patientId = this.route.snapshot.paramMap.get('id');
        if (this.patientId) {
            this.isEditMode = true;
            this.loadPatient(this.patientId);
        }
    }

    loadDocumentTypes() {
        this.docTypesService.getDocumentTypes().subscribe({
            next: (types) => this.documentTypes = types,
            error: () => this.snackBar.open('Error al cargar tipos de documento', 'Cerrar', { duration: 3000 })
        });
    }

    loadPatient(id: string) {
        this.patientsService.getPatient(id).subscribe({
            next: (patient) => {
                this.form.patchValue(patient);
            },
            error: () => {
                this.snackBar.open('Error al cargar paciente', 'Cerrar', { duration: 3000 });
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
                this.snackBar.open('Paciente guardado exitosamente', 'Cerrar', { duration: 3000 });
                this.router.navigate(['/reception/patients']);
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al guardar paciente', 'Cerrar', { duration: 3000 });
                this.isSaving = false;
            }
        });
    }

    cancel() {
        this.router.navigate(['/reception/patients']);
    }
}

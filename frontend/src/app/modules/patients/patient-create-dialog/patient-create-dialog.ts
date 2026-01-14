import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { PatientsService } from '../patients.service';
import { DocumentTypesService, DocumentType } from '../../configuration/document-types.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Patient } from '../patients.models';

@Component({
    selector: 'app-patient-create-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './patient-create-dialog.html'
})
export class PatientCreateDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private patientsService = inject(PatientsService);
    private docTypesService = inject(DocumentTypesService);
    private notificationService = inject(NotificationService);
    public dialogRef = inject(DialogRef<Patient>);

    form: FormGroup;
    documentTypes: DocumentType[] = [];
    isSaving = false;

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
    }

    loadDocumentTypes() {
        this.docTypesService.getDocumentTypes().subscribe({
            next: (types) => this.documentTypes = types,
            error: () => this.notificationService.showError('Error al cargar tipos de documento')
        });
    }

    close() {
        this.dialogRef.close();
    }

    save() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const formValue = this.form.value;
        const payload = {
            ...formValue,
            email: formValue.email || undefined,
            phone: formValue.phone || undefined,
            address: formValue.address || undefined,
            history: formValue.history || undefined
        };

        this.patientsService.createPatient(payload).subscribe({
            next: (patient) => {
                this.notificationService.showSuccess('Paciente registrado correctamente');
                this.dialogRef.close(patient);
            },
            error: (err) => {
                console.error(err);
                this.notificationService.showError('Error al registrar paciente');
                this.isSaving = false;
            }
        });
    }
}

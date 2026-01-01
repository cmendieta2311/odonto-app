import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientsService } from '../../../patients/patients.service';
import { Patient } from '../../../patients/patients.models';
import { UsersService } from '../../../admin/users/users.service';
import { User } from '../../../admin/users/users.models';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Appointment } from '../../services/appointments.service';

@Component({
    selector: 'app-appointment-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './appointment-dialog.html',
})
export class AppointmentDialogComponent implements OnInit, OnChanges {
    @Input() isOpen = false;
    @Input() date: string = '';
    @Input() startTime: string = '';
    @Input() appointment: Appointment | null = null;
    @Output() closeDialog = new EventEmitter<void>();
    @Output() saveAppointment = new EventEmitter<any>();
    @Output() deleteAppointment = new EventEmitter<string>();

    patientsService = inject(PatientsService);
    usersService = inject(UsersService);

    isEdit = false;
    patientName = '';
    selectedPatientId: string | null = null;
    duration = 30;
    notes = '';
    dentistId = '';
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' = 'PENDING';
    dentists: User[] = [];

    // Errors
    errors = {
        patient: false,
        date: false,
        time: false,
        duration: false,
        dentist: false
    };

    // Search
    searchResults: Patient[] = [];
    searchSubject = new Subject<string>();
    showResults = false;

    constructor() {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.patientsService.getPatients(term))
        ).subscribe(results => {
            this.searchResults = results;
            this.showResults = true;
        });
    }

    ngOnInit() {
        this.loadDentists();
    }

    ngOnChanges(changes: SimpleChanges) {
        const appointment = this.appointment;

        // Check if we need to populate the form (edit mode)
        // Case 1: The 'appointment' input changed and acts as the trigger (and is not null)
        // Case 2: The dialog was opened ('isOpen' changed to true) and we have an appointment selected
        if (appointment && (changes['appointment'] || (changes['isOpen'] && this.isOpen))) {
            this.isEdit = true;
            this.patientName = appointment.title || '';
            this.selectedPatientId = appointment.patientId || null;
            this.notes = appointment.notes || '';
            this.dentistId = appointment.dentistId || '';
            this.status = appointment.status || 'PENDING';

            // Extract Date and Time from appointment.startTime
            const start = new Date(appointment.startTime);
            const end = new Date(appointment.endTime);
            this.date = start.toISOString().split('T')[0];
            this.startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            // Calculate duration in minutes
            this.duration = Math.round((end.getTime() - start.getTime()) / 60000);
        } else if (changes['isOpen'] && this.isOpen && !appointment) {
            // Reset for new appointment if opening without an existing appointment
            this.isEdit = false;
            this.resetForm();
        }
    }

    loadDentists() {
        this.usersService.getUsers('ODONTOLOGO').subscribe(users => {
            this.dentists = users;
        });
    }

    onSearchInput(event: any) {
        const term = event.target.value;
        this.patientName = term;
        this.errors.patient = false; // Clear error on type
        if (term.length > 1) {
            this.searchSubject.next(term);
        } else {
            this.searchResults = [];
            this.showResults = false;
        }
    }

    selectPatient(patient: Patient) {
        this.patientName = `${patient.firstName} ${patient.lastName}`;
        this.selectedPatientId = patient.id;
        this.errors.patient = false;
        this.showResults = false;
    }

    close() {
        this.closeDialog.emit();
        this.resetForm();
    }

    validate(): boolean {
        this.errors = {
            patient: !this.selectedPatientId,
            date: !this.date,
            time: !this.startTime,
            duration: !this.duration,
            dentist: !this.dentistId
        };
        return !Object.values(this.errors).some(error => error);
    }

    save() {
        if (!this.validate()) {
            return;
        }

        const start = new Date(this.date + 'T' + this.startTime);
        const end = new Date(start.getTime() + this.duration * 60000);

        this.saveAppointment.emit({
            id: this.appointment?.id, // Include ID if editing
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            title: this.patientName || 'Cita',
            notes: this.notes,
            status: this.status,
            patientId: this.selectedPatientId,
            dentistId: this.dentistId
        });
        this.close();
    }

    delete() {
        if (this.appointment && this.appointment.id) {
            if (confirm('¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.')) {
                this.deleteAppointment.emit(this.appointment.id);
                this.close();
            }
        }
    }

    resetForm() {
        this.patientName = '';
        this.selectedPatientId = null;
        this.notes = '';
        this.status = 'PENDING';
        this.searchResults = [];
        this.errors = {
            patient: false,
            date: false,
            time: false,
            duration: false,
            dentist: false
        };
    }
}

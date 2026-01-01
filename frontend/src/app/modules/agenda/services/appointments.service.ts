import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface Appointment {
    id: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    title?: string;
    notes?: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    patientId?: string;
    dentistId?: string;
    patient?: any;
    dentist?: any;
}

export interface CreateAppointmentDto {
    startTime: string;
    endTime: string;
    title?: string;
    notes?: string;
    patientId?: string;
    dentistId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AppointmentsService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/appointments`;

    getAppointments(start: string, end: string): Observable<Appointment[]> {
        let params = new HttpParams().set('start', start).set('end', end);
        return this.http.get<Appointment[]>(this.apiUrl, { params });
    }

    createAppointment(appointment: CreateAppointmentDto): Observable<Appointment> {
        return this.http.post<Appointment>(this.apiUrl, appointment);
    }

    updateAppointment(id: string, appointment: Partial<CreateAppointmentDto>): Observable<Appointment> {
        return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, appointment);
    }

    deleteAppointment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

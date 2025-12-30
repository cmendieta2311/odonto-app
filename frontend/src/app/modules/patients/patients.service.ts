import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Patient } from './patients.models';

@Injectable({
    providedIn: 'root'
})
export class PatientsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getPatients(search?: string) {
        const params: any = {};
        if (search) params.search = search;
        return this.http.get<Patient[]>(`${this.apiUrl}/patients`, { params });
    }

    getPatient(id: string) {
        return this.http.get<Patient>(`${this.apiUrl}/patients/${id}`);
    }

    createPatient(patient: Partial<Patient>) {
        return this.http.post<Patient>(`${this.apiUrl}/patients`, patient);
    }

    updatePatient(id: string, patient: Partial<Patient>) {
        return this.http.patch<Patient>(`${this.apiUrl}/patients/${id}`, patient);
    }

    deletePatient(id: string) {
        return this.http.delete(`${this.apiUrl}/patients/${id}`);
    }
}

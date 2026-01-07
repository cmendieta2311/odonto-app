import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Patient } from './patients.models';
import { PaginatedResult } from '../../shared/interfaces/paginated-result';

@Injectable({
    providedIn: 'root'
})
export class PatientsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getPatients(page: number = 1, limit: number = 10, search: string = '') {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<PaginatedResult<Patient>>(`${this.apiUrl}/patients`, { params });
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

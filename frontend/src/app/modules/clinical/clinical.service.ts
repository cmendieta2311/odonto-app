import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ServicePerformed {
    id: string;
    date: string;
    serviceId: string;
    patientId: string;
    toothNumber?: number;
    surface?: string;
    notes?: string;
    service?: {
        code: string;
        name: string;
    };
}

export interface CreateClinicalDto {
    serviceId: string; // ID of the generic service (e.g. 'restoration-composite')
    patientId: string;
    toothNumber?: number;
    surface?: string;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClinicalService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/clinical`;

    getHistory(patientId: string): Observable<ServicePerformed[]> {
        let params = new HttpParams().set('patientId', patientId);
        return this.http.get<ServicePerformed[]>(this.apiUrl, { params });
    }

    createRecord(data: CreateClinicalDto): Observable<ServicePerformed> {
        return this.http.post<ServicePerformed>(this.apiUrl, data);
    }
}

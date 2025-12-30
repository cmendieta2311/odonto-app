import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Office } from './office.model';

@Injectable({
    providedIn: 'root'
})
export class OfficesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/configuration/offices`;

    findAll() {
        return this.http.get<Office[]>(this.apiUrl);
    }

    create(office: Partial<Office>) {
        return this.http.post<Office>(this.apiUrl, office);
    }

    update(id: string, office: Partial<Office>) {
        return this.http.patch<Office>(`${this.apiUrl}/${id}`, office);
    }

    delete(id: string) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreateInvoiceDto, Invoice } from './invoices.models';
import { PaginatedResult } from '../../shared/interfaces/paginated-result';

@Injectable({
    providedIn: 'root'
})
export class InvoicesService {
    private apiUrl = `${environment.apiUrl}/invoices`;

    constructor(private http: HttpClient) { }

    findAll(page: number = 1, limit: number = 10, search: string = '', status: string = '', startDate: string = '', endDate: string = '', patientId: string = ''): Observable<PaginatedResult<Invoice>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) params = params.set('search', search);
        if (status && status !== 'Todos') params = params.set('status', status);
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        if (patientId) params = params.set('patientId', patientId);

        return this.http.get<PaginatedResult<Invoice>>(this.apiUrl, { params });
    }

    findOne(id: string): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    create(createInvoiceDto: CreateInvoiceDto): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, createInvoiceDto);
    }

    update(id: string, data: any): Observable<Invoice> {
        return this.http.put<Invoice>(`${this.apiUrl}/${id}`, data);
    }

    // Helper to calculate total
    calculateTotal(items: any[]): number {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }
}

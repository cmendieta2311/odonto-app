import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateInvoiceDto, Invoice } from './invoices.models';

@Injectable({
    providedIn: 'root'
})
export class InvoicesService {
    private apiUrl = 'http://localhost:3000/invoices'; // Hardcoded for now, or use environment

    constructor(private http: HttpClient) { }

    findAll(filters?: any): Observable<Invoice[]> {
        let params: any = {};
        if (filters) {
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
        }
        return this.http.get<Invoice[]>(this.apiUrl, { params });
    }

    findOne(id: string): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    create(createInvoiceDto: CreateInvoiceDto): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, createInvoiceDto);
    }

    // Helper to calculate total
    calculateTotal(items: any[]): number {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }
}

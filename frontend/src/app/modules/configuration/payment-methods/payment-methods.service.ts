import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export enum PaymentType {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    TRANSFER = 'TRANSFER',
    CREDIT = 'CREDIT',
    OTHER = 'OTHER'
}

export interface PaymentMethod {
    id: string;
    code: PaymentType;
    name: string;
    requiresReference: boolean;
    isCash: boolean;
    isActive: boolean;
    tenantId: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentMethodsService {
    private apiUrl = `${environment.apiUrl}/payment-methods`;

    constructor(private http: HttpClient) { }

    findAll(): Observable<PaymentMethod[]> {
        return this.http.get<PaymentMethod[]>(this.apiUrl);
    }

    create(data: Partial<PaymentMethod>): Observable<PaymentMethod> {
        return this.http.post<PaymentMethod>(this.apiUrl, data);
    }

    update(id: string, data: Partial<PaymentMethod>): Observable<PaymentMethod> {
        return this.http.patch<PaymentMethod>(`${this.apiUrl}/${id}`, data);
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

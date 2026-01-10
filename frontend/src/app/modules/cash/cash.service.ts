import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum CashMovementType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    OPENING = 'OPENING',
    CLOSING = 'CLOSING'
}

export enum PaymentMethod {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    TRANSFER = 'TRANSFER',
    CREDIT = 'CREDIT',
    OTHER = 'OTHER'
}

export interface CashMovement {
    id: string;
    date: string;
    type: CashMovementType;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    referenceId?: string;
    source?: string;
}

export interface DailySummary {
    income: number;
    expense: number;
    balance: number;
}

export interface CashStatus {
    isOpen: boolean;
    openingTime?: string;
    closingTime?: string;
    startBalance: number;
    income: number;
    expense: number;
    currentBalance: number;
    isClosed: boolean;
    openedBy?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CashService {
    private apiUrl = `${environment.apiUrl}/cash`;

    constructor(private http: HttpClient) { }

    create(data: Partial<CashMovement>): Observable<CashMovement> {
        return this.http.post<CashMovement>(`${this.apiUrl}/movements`, data);
    }

    findAll(date?: string): Observable<CashMovement[]> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<CashMovement[]>(`${this.apiUrl}/movements`, { params });
    }

    getDailySummary(date?: string): Observable<DailySummary> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<DailySummary>(`${this.apiUrl}/summary`, { params });
    }

    getStatus(date?: string): Observable<CashStatus> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<CashStatus>(`${this.apiUrl}/status`, { params });
    }

    openCash(initialAmount: number): Observable<CashMovement> {
        return this.http.post<CashMovement>(`${this.apiUrl}/open`, { initialAmount });
    }

    closeCash(): Observable<CashMovement> {
        return this.http.post<CashMovement>(`${this.apiUrl}/close`, {});
    }

    getHistory(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/history`);
    }
}

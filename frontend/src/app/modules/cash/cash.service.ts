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
    id?: string;
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

export interface CashSession {
    id: string;
    startTime: string;
    endTime?: string;
    startBalance: number;
    finalBalance: number;
    status: 'OPEN' | 'CLOSED';
    openedBy?: string;
    closedBy?: string;
}

export interface CashRegister {
    id: string;
    name: string;
    isActive: boolean;
    tenantId: string;
}

@Injectable({
    providedIn: 'root'
})
export class CashService {
    private apiUrl = `${environment.apiUrl}/cash`;

    constructor(private http: HttpClient) { }

    getRegisters(): Observable<CashRegister[]> {
        return this.http.get<CashRegister[]>(`${this.apiUrl}/registers`);
    }

    create(data: Partial<CashMovement>): Observable<CashMovement> {
        return this.http.post<CashMovement>(`${this.apiUrl}/movements`, data);
    }

    findAll(date?: string, cashRegisterId?: string, cashSessionId?: string): Observable<CashMovement[]> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        if (cashRegisterId) params = params.set('cashRegisterId', cashRegisterId);
        if (cashSessionId) params = params.set('cashSessionId', cashSessionId);

        return this.http.get<CashMovement[]>(`${this.apiUrl}/movements`, { params });
    }

    getDailySummary(date?: string, cashRegisterId?: string): Observable<DailySummary> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        if (cashRegisterId) params = params.set('cashRegisterId', cashRegisterId);

        return this.http.get<DailySummary>(`${this.apiUrl}/summary`, { params });
    }

    getStatus(date?: string, cashRegisterId?: string): Observable<CashStatus> {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        if (cashRegisterId) params = params.set('cashRegisterId', cashRegisterId);

        return this.http.get<CashStatus>(`${this.apiUrl}/status`, { params });
    }

    openCash(initialAmount: number, cashRegisterId?: string): Observable<CashMovement> {
        return this.http.post<CashMovement>(`${this.apiUrl}/open`, { initialAmount, cashRegisterId });
    }

    closeCash(cashRegisterId?: string): Observable<CashMovement> {
        return this.http.post<CashMovement>(`${this.apiUrl}/close`, { cashRegisterId });
    }

    getHistory(cashRegisterId?: string): Observable<CashSession[]> {
        let params = new HttpParams();
        if (cashRegisterId) params = params.set('cashRegisterId', cashRegisterId);
        return this.http.get<CashSession[]>(`${this.apiUrl}/history`, { params });
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreatePaymentDto, PaymentIndex } from './payments.models';

@Injectable({
    providedIn: 'root'
})
export class PaymentsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    createPayment(data: CreatePaymentDto) {
        return this.http.post(`${this.apiUrl}/payments`, data);
    }

    getPayments() {
        return this.http.get<PaymentIndex[]>(`${this.apiUrl}/payments`);
    }
}

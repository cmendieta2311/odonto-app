import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Contract } from './contracts.models';
import { PaginatedResult } from '../../shared/interfaces/paginated-result';
import { map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ContractsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    createContract(data: { quoteId: string; paymentMethod: string; installments?: number }) {
        return this.http.post<Contract>(`${this.apiUrl}/contracts`, data);
    }

    getContractsByPatient(patientId: string) {
        return this.http.get<PaginatedResult<Contract>>(`${this.apiUrl}/contracts`, {
            params: { patientId }
        }).pipe(
            map(res => res.data)
        );
    }

    getContracts(page: number = 1, limit: number = 10, search: string = '', status: string = '', paymentMethod: string = '') {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search) params = params.set('search', search);
        if (status) params = params.set('status', status);
        if (paymentMethod) params = params.set('paymentMethod', paymentMethod);

        return this.http.get<PaginatedResult<Contract>>(`${this.apiUrl}/contracts`, { params });
    }

    getContract(id: string) {
        return this.http.get<Contract>(`${this.apiUrl}/contracts/${id}`);
    }

    generateProforma(contractId: string) {
        return this.http.post(`${this.apiUrl}/contracts/${contractId}/proforma`, {});
    }
}

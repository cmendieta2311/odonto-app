import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Contract } from './contracts.models';

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
        return this.http.get<Contract[]>(`${this.apiUrl}/contracts`, {
            params: { patientId }
        });
    }

    getContracts() {
        return this.http.get<Contract[]>(`${this.apiUrl}/contracts`);
    }

    getContract(id: string) {
        return this.http.get<Contract>(`${this.apiUrl}/contracts/${id}`);
    }

    generateProforma(contractId: string) {
        return this.http.post(`${this.apiUrl}/contracts/${contractId}/proforma`, {});
    }
}

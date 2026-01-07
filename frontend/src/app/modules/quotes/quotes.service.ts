import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Quote } from './quotes.models';
import { PaginatedResult } from '../../shared/interfaces/paginated-result';

@Injectable({
    providedIn: 'root'
})
export class QuotesService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getQuotes(page = 1, limit = 10, search = '', status = '') {
        let params: any = { page, limit };
        if (search) params.search = search;
        if (status) params.status = status;

        return this.http.get<PaginatedResult<Quote>>(`${this.apiUrl}/quotes`, { params });
    }

    getQuote(id: string) {
        return this.http.get<Quote>(`${this.apiUrl}/quotes/${id}`);
    }

    createQuote(quote: Partial<Quote>) {
        return this.http.post<Quote>(`${this.apiUrl}/quotes`, quote);
    }

    updateQuote(id: string, quote: Partial<Quote>) {
        return this.http.patch<Quote>(`${this.apiUrl}/quotes/${id}`, quote);
    }

    deleteQuote(id: string) {
        return this.http.delete(`${this.apiUrl}/quotes/${id}`);
    }
}

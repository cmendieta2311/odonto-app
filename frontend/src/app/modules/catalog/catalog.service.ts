import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Service, ServiceCategory } from './catalog.models';

@Injectable({
    providedIn: 'root'
})
export class CatalogService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Categories
    getCategories() {
        return this.http.get<ServiceCategory[]>(`${this.apiUrl}/service-categories`);
    }

    createCategory(category: Partial<ServiceCategory>) {
        return this.http.post<ServiceCategory>(`${this.apiUrl}/service-categories`, category);
    }

    updateCategory(id: string, category: Partial<ServiceCategory>) {
        return this.http.patch<ServiceCategory>(`${this.apiUrl}/service-categories/${id}`, category);
    }

    deleteCategory(id: string) {
        return this.http.delete(`${this.apiUrl}/service-categories/${id}`);
    }

    // Services
    getServices() {
        return this.http.get<Service[]>(`${this.apiUrl}/services`);
    }

    createService(service: Partial<Service>) {
        return this.http.post<Service>(`${this.apiUrl}/services`, service);
    }

    updateService(id: string, service: Partial<Service>) {
        return this.http.patch<Service>(`${this.apiUrl}/services/${id}`, service);
    }

    deleteService(id: string) {
        return this.http.delete(`${this.apiUrl}/services/${id}`);
    }
}

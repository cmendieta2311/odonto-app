import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ServiceArea, ServiceCategory } from '../catalog/catalog.models';

@Injectable({
    providedIn: 'root'
})
export class ServiceCatalogService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Areas
    getAreas(): Observable<ServiceArea[]> {
        return this.http.get<ServiceArea[]>(`${this.apiUrl}/service-areas`);
    }

    createArea(name: string): Observable<ServiceArea> {
        return this.http.post<ServiceArea>(`${this.apiUrl}/service-areas`, { name });
    }

    updateArea(id: string, name: string): Observable<ServiceArea> {
        return this.http.patch<ServiceArea>(`${this.apiUrl}/service-areas/${id}`, { name });
    }

    deleteArea(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/service-areas/${id}`);
    }

    // Categories
    getCategories(): Observable<ServiceCategory[]> {
        return this.http.get<ServiceCategory[]>(`${this.apiUrl}/service-categories`);
    }

    createCategory(name: string, areaId: string): Observable<ServiceCategory> {
        return this.http.post<ServiceCategory>(`${this.apiUrl}/service-categories`, { name, areaId });
    }

    updateCategory(id: string, name: string, areaId?: string): Observable<ServiceCategory> {
        return this.http.patch<ServiceCategory>(`${this.apiUrl}/service-categories/${id}`, { name, areaId });
    }

    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/service-categories/${id}`);
    }
}

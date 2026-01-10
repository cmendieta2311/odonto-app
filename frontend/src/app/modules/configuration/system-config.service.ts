import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SystemConfigService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getConfigs(): Observable<{ [key: string]: any }> {
        return this.http.get<{ [key: string]: any }>(`${this.apiUrl}/configuration/system`);
    }

    saveConfigs(configs: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/configuration/system`, configs);
    }

    uploadLogo(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(`${this.apiUrl}/upload/logo`, formData);
    }
}

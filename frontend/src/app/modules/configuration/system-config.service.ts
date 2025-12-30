import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SystemConfigService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/configuration/system`;

    getConfigs(): Observable<{ [key: string]: any }> {
        return this.http.get<{ [key: string]: any }>(this.apiUrl);
    }

    saveConfigs(configs: { [key: string]: any }): Observable<any> {
        return this.http.post(this.apiUrl, configs);
    }
}

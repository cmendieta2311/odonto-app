import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface DocumentType {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentTypesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/configuration/document-types`;

    getDocumentTypes(): Observable<DocumentType[]> {
        return this.http.get<DocumentType[]>(this.apiUrl);
    }
}

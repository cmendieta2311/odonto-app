import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto } from './users.models';

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/users`;

    getUsers(role?: string): Observable<User[]> {
        const params: any = {};
        if (role) params.role = role;
        return this.http.get<User[]>(this.apiUrl, { params });
    }

    getUser(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    create(user: CreateUserDto): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    update(id: string, user: UpdateUserDto): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${id}`, user);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getDocumentTypes(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/configuration/document-types`);
    }
}

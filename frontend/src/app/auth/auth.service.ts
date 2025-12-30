import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    currentUser = signal<any>(null);

    constructor(private http: HttpClient, private router: Router) {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Optimistically set token, then fetch profile
            this.currentUser.set({ token });
            this.getProfile().subscribe();
        }
    }

    isOpen() {
        return !!this.currentUser();
    }

    getProfile() {
        return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
            tap(user => {
                const current = this.currentUser();
                this.currentUser.set({ ...current, ...user });
            })
        );
    }

    login(credentials: any) {
        return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
            tap((response) => {
                localStorage.setItem('access_token', response.access_token);
                this.currentUser.set({ token: response.access_token });
                this.getProfile().subscribe();
                this.router.navigate(['/']);
            })
        );
    }

    register(user: any) {
        return this.http.post(`${this.apiUrl}/register`, user);
    }

    logout() {
        localStorage.removeItem('access_token');
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }
}

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ServicePerformed {
    id: string;
    date: string;
    service: {
        code: string;
        name: string;
    };
    notes?: string;
}

@Component({
    selector: 'app-clinical-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './clinical-history.html'
})
export class ClinicalHistoryComponent implements OnInit {
    @Input() patientId: string = '';

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/clinical`;

    history: ServicePerformed[] = [];
    isLoading = true;

    ngOnInit() {
        if (this.patientId) {
            this.loadHistory();
        }
    }

    loadHistory() {
        this.isLoading = true;
        this.http.get<ServicePerformed[]>(`${this.apiUrl}?patientId=${this.patientId}`).subscribe({
            next: (data) => {
                this.history = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }
}

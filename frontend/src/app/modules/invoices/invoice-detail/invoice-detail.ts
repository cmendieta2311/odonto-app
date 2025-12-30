import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { InvoicesService } from '../invoices.service';
import { Invoice } from '../invoices.models';

@Component({
    selector: 'app-invoice-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './invoice-detail.html',
    styleUrl: './invoice-detail.css'
})
export class InvoiceDetailComponent implements OnInit {
    private invoicesService = inject(InvoicesService);
    private route = inject(ActivatedRoute);

    invoice: Invoice | null = null;
    isLoading = true;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadInvoice(id);
        }
    }

    loadInvoice(id: string) {
        this.isLoading = true;
        this.invoicesService.findOne(id).subscribe({
            next: (data) => {
                this.invoice = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading invoice', err);
                this.isLoading = false;
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}

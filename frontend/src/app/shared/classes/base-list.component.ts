import { Component, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Component({
    template: ''
})
export abstract class BaseListComponent<T> implements OnInit {
    // Dependencies common to all lists
    protected snackBar = inject(MatSnackBar);
    protected dialog = inject(MatDialog);

    // State
    data: T[] = [];
    isLoading = false;

    // Pagination
    page = 1;
    pageSize = 10;
    totalItems = 0;

    // Filtering
    searchQuery = '';

    // Observables
    protected destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.loadData();
    }

    abstract loadData(): void;

    onPageChange(page: number): void {
        this.page = page;
        this.loadData();
    }

    onSearch(query: string): void {
        this.searchQuery = query;
        this.page = 1; // Reset to first page
        this.loadData();
    }

    onPageSizeChange(newSize: number): void {
        this.pageSize = newSize;
        this.page = 1;
        this.loadData();
    }

    protected handleError(err: any, message: string = 'Error al cargar datos') {
        console.error(err);
        this.isLoading = false;
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
    }
}

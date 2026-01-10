import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private snackBar = inject(MatSnackBar);

    showSuccess(message: string) {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'end',
            verticalPosition: 'top'
        });
    }

    showError(message: string) {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'end',
            verticalPosition: 'top'
        });
    }

    showMessage(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
        });
    }
}

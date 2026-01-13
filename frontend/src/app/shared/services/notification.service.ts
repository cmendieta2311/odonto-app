import { Injectable, inject } from '@angular/core';
import { ToastService } from '../components/toast/toast.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private toastService = inject(ToastService);

    showSuccess(message: string) {
        this.toastService.show(message, 'success');
    }

    showError(message: string) {
        // Longer duration for errors
        this.toastService.show(message, 'error', 5000);
    }

    showMessage(message: string) {
        this.toastService.show(message, 'info');
    }
}

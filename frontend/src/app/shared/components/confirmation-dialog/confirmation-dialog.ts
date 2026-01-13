import { Component, Input, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef } from '../modal/modal.types';
import { ModalComponent } from '../modal/modal.component';

export interface ConfirmationDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    color?: 'primary' | 'warn' | 'accent';
}

@Component({
    selector: 'app-confirmation-dialog',
    standalone: true,
    imports: [CommonModule, ModalComponent],
    templateUrl: './confirmation-dialog.html'
})
export class ConfirmationDialogComponent {
    @Input() data!: ConfirmationDialogData;
    @Input() activeModal: any;

    onConfirm(): void {
        this.activeModal.close(true);
    }

    onCancel(): void {
        this.activeModal.close(false);
    }
}


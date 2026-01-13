import { Component, inject, ViewContainerRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ModalService } from './modal.service';
import { ModalWrapperComponent } from './modal-wrapper.component';

@Component({
    selector: 'app-modal-container',
    standalone: true,
    imports: [CommonModule, NgComponentOutlet, ModalWrapperComponent],
    template: `
    @if (modalService.activeModals().length > 0) {
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        [@backdrop]="'enter'">
        
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          (click)="onBackdropClick()">
        </div>

        <!-- Modals Stack -->
        @for (modal of modalService.activeModals(); track modal.id) {
            <app-modal-wrapper [config]="modal.config">
                <ng-container *ngComponentOutlet="modal.component; inputs: { data: modal.config.data, activeModal: modal }"></ng-container>
            </app-modal-wrapper>
        }
      </div>
    }
  `,
    animations: [
        trigger('backdrop', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class ModalContainerComponent {
    modalService = inject(ModalService);

    onBackdropClick() {
        const modals = this.modalService.activeModals();
        if (modals.length > 0) {
            const topModal = modals[modals.length - 1];
            if (!topModal.config.disableClose) {
                topModal.close();
            }
        }
    }
}

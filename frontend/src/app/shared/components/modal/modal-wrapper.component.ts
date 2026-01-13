import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { ModalConfig } from './modal.types';

@Component({
    selector: 'app-modal-wrapper',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col pointer-events-auto transform transition-all"
      [@modalState]="'enter'"
      [style.width]="config.width || 'auto'"
      [style.max-width]="config.maxWidth || '90vw'"
      [style.height]="config.height || 'auto'"
      [style.max-height]="config.maxHeight || '90vh'"
      (click)="$event.stopPropagation()">
      
      <ng-content></ng-content>
      
    </div>
  `,
    animations: [
        trigger('modalState', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
            ])
        ])
    ]
})
export class ModalWrapperComponent {
    @Input() config: ModalConfig = {};
}

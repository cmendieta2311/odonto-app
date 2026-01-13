import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <!-- Header -->
      @if (title) {
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold">{{ title }}</h2>
          @if (showCloseButton) {
            <button (click)="close.emit()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>
      }

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <ng-content></ng-content>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-lg">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `
})
export class ModalComponent {
    @Input() title: string = '';
    @Input() showCloseButton: boolean = true;
    @Output() close = new EventEmitter<void>();
}

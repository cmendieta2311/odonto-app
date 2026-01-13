import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastService, ToastType } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 w-full max-w-md pointer-events-none">
      <div *ngFor="let toast of toastService.toasts()" 
           @slideInOut
           class="pointer-events-auto w-full bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-4">
        
        <!-- Icon Container -->
        <div [ngClass]="getIconColors(toast.type)" class="shrink-0 rounded-full p-2 flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px] font-bold">
            {{ getIcon(toast.type) }}
          </span>
        </div>

        <!-- Content -->
        <div class="flex-1 pt-0.5">
          <p class="font-bold text-gray-900 dark:text-white text-sm leading-tight">
            {{ toast.message }}
          </p>
        </div>

        <!-- Close Button -->
        <button (click)="toastService.remove(toast.id)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors -mt-1 -mr-1 p-1">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  `,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent {
  toastService = inject(ToastService);

  getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  getIconColors(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
}

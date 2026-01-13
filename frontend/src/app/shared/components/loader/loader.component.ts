import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex flex-col items-center justify-center p-8 space-y-4 h-full min-h-[200px]">
      <div class="relative w-12 h-12">
        <!-- Background circle -->
        <div class="absolute w-12 h-12 border-4 border-gray-200 rounded-full dark:border-gray-700"></div>
        <!-- Spinning circle -->
        <div class="absolute w-12 h-12 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p *ngIf="message" class="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">{{ message }}</p>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class LoaderComponent {
    @Input() message: string = 'Cargando datos...';
}

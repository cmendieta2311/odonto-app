import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center" [ngClass]="{'gap-3': size === 'normal', 'gap-2': size === 'small'}">
      <div 
        class="text-primary flex items-center justify-center p-1"
        [ngClass]="{'size-10': size === 'normal', 'size-8': size === 'small'}">
        <span class="material-symbols-outlined" 
              [ngClass]="{'text-[32px]': size === 'normal', 'text-[24px]': size === 'small'}">
          dentistry
        </span>
      </div>
      <div class="flex flex-col" *ngIf="showTitle">
        <h1 class="text-text-main-light dark:text-text-main-dark font-bold leading-none tracking-tight"
            [ngClass]="{'text-lg': size === 'normal', 'text-base': size === 'small'}">
          DentaManager
        </h1>
        <p *ngIf="subtitle"
           class="text-text-secondary-light dark:text-text-secondary-dark font-medium uppercase tracking-wide mt-1"
           [ngClass]="{'text-[11px]': size === 'normal', 'text-[10px]': size === 'small'}">
          {{ subtitle }}
        </p>
      </div>
    </div>
  `
})
export class BrandLogoComponent {
  @Input() showTitle = true;
  @Input() size: 'small' | 'normal' = 'normal';
  @Input() subtitle = 'Gestión Odontológica';
}

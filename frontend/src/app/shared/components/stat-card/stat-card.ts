import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-[#dbe4e6] dark:border-[#2a3e42] shadow-sm flex flex-col gap-1">
      <div class="flex justify-between items-start">
        <p class="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">{{label}}</p>
        <span class="material-symbols-outlined p-1 rounded-md" [ngClass]="iconClasses" style="font-size: 20px;">{{icon}}</span>
      </div>
      <p class="text-2xl font-bold text-text-main-light dark:text-text-main-dark">{{value}}</p>
      <p *ngIf="trendLabel" [ngClass]="trendClasses" class="text-xs font-bold flex items-center gap-1">
        <span *ngIf="trendIcon" class="material-symbols-outlined" style="font-size: 16px;">{{trendIcon}}</span>
        {{trendLabel}}
      </p>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class StatCardComponent {
    @Input({ required: true }) label!: string;
    @Input({ required: true }) value!: string | number;
    @Input({ required: true }) icon!: string;
    @Input() trendLabel?: string;
    @Input() trendIcon?: string;
    @Input() variant: 'primary' | 'red' | 'blue' | 'purple' | 'green' = 'primary';

    get iconClasses() {
        return {
            'text-primary bg-primary/10': this.variant === 'primary',
            'text-red-500 bg-red-500/10': this.variant === 'red',
            'text-blue-500 bg-blue-500/10': this.variant === 'blue',
            'text-purple-500 bg-purple-500/10': this.variant === 'purple',
            'text-green-600 bg-green-600/10': this.variant === 'green',
        };
    }

    get trendClasses() {
        return {
            'text-green-600': this.variant === 'green' || (!this.variant || this.variant === 'primary'),
            'text-red-500': this.variant === 'red',
            'text-text-secondary-light dark:text-text-secondary-dark': this.variant === 'blue' || this.variant === 'purple',
        };
    }
}

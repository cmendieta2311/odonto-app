import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToothSurfaceStatus {
  vestibular?: string; // e.g., 'caries', 'restoration'
  lingual?: string;
  mesial?: string;
  distal?: string;
  occlusal?: string;
}

@Component({
  selector: 'app-tooth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooth-wrapper flex flex-col items-center gap-1 select-none">
      <div class="relative w-10 h-10">
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm filter hover:drop-shadow-md transition-all">
          <!-- Vestibular (Top) -->
          <polygon points="0,0 100,0 75,25 25,25" 
                   [class]="classes.vestibular"
                   (click)="onSurfaceClick('vestibular')"
                   class="stroke-slate-300 stroke-1 cursor-pointer hover:opacity-80 transition-colors" />
          
          <!-- Lingual (Bottom) -->
          <polygon points="25,75 75,75 100,100 0,100" 
                   [class]="classes.lingual"
                   (click)="onSurfaceClick('lingual')"
                   class="stroke-slate-300 stroke-1 cursor-pointer hover:opacity-80 transition-colors" />
          
          <!-- Mesial (Left) -->
          <polygon points="0,0 25,25 25,75 0,100" 
                   [class]="classes.mesial"
                   (click)="onSurfaceClick('mesial')"
                   class="stroke-slate-300 stroke-1 cursor-pointer hover:opacity-80 transition-colors" />
          
          <!-- Distal (Right) -->
          <polygon points="100,0 100,100 75,75 75,25" 
                   [class]="classes.distal"
                   (click)="onSurfaceClick('distal')"
                   class="stroke-slate-300 stroke-1 cursor-pointer hover:opacity-80 transition-colors" />
          
          <!-- Occlusal (Center) -->
          <rect x="25" y="25" width="50" height="50" 
                [class]="classes.occlusal"
                (click)="onSurfaceClick('occlusal')"
                class="stroke-slate-300 stroke-1 cursor-pointer hover:opacity-80 transition-colors" />
        </svg>
      </div>
      <span class="text-[10px] font-bold text-slate-500">{{ toothNumber }}</span>
    </div>
  `,
  styles: [`
    .surface-normal { fill: #f8fafc; } /* slate-50 */
    .surface-caries { fill: #ef4444; } /* red-500 */
    .surface-restoration { fill: #3b82f6; } /* blue-500 */
    .surface-extraction { fill: #1e293b; opacity: 0.8; } /* slate-800 */
    
    /* Dark mode overrides if needed via global classes or :host-context */
  `]
})
export class ToothComponent {
  @Input() toothNumber!: number;
  @Input() status: ToothSurfaceStatus = {};
  @Output() surfaceClick = new EventEmitter<string>();

  onSurfaceClick(surface: string) {
    this.surfaceClick.emit(surface);
  }

  get classes() {
    return {
      vestibular: this.getSurfaceClass(this.status.vestibular),
      lingual: this.getSurfaceClass(this.status.lingual),
      mesial: this.getSurfaceClass(this.status.mesial),
      distal: this.getSurfaceClass(this.status.distal),
      occlusal: this.getSurfaceClass(this.status.occlusal),
    };
  }

  private getSurfaceClass(status?: string): string {
    switch (status) {
      case 'caries': return 'surface-caries';
      case 'restoration': return 'surface-restoration';
      case 'extraction': return 'surface-extraction';
      default: return 'surface-normal';
    }
  }
}

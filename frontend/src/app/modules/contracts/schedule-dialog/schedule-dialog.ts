import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditSchedule } from '../contracts.models';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-dialog.html',
  styleUrl: './schedule-dialog.css'
})
export class ScheduleDialogComponent {
  @Input() data: { schedule: CreditSchedule[] } = { schedule: [] };
  @Input() activeModal: any;
}

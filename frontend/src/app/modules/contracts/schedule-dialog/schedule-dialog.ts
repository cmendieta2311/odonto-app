import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CreditSchedule } from '../contracts.models';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './schedule-dialog.html',
  styleUrl: './schedule-dialog.css'
})
export class ScheduleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ScheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { schedule: CreditSchedule[] }
  ) { }
}

import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { OfficesService } from '../offices.service';
import { Office } from '../office.model';

@Component({
  selector: 'app-office-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './office-form.html',
  styleUrl: './office-form.css'
})
export class OfficeForm implements OnInit {
  private fb = inject(FormBuilder);
  private officesService = inject(OfficesService);
  private dialogRef = inject(MatDialogRef<OfficeForm>);

  form: FormGroup;
  isEdit = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      location: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.isEdit = true;
      this.form.patchValue(this.data);
    }
  }

  save() {
    if (this.form.invalid) return;

    const officeData = this.form.value;

    if (this.isEdit && this.data) {
      this.officesService.update(this.data.id, officeData).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      this.officesService.create(officeData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}

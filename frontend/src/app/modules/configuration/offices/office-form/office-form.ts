import { Component, Inject, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OfficesService } from '../offices.service';
import { Office } from '../office.model';

@Component({
  selector: 'app-office-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './office-form.html',
  styleUrl: './office-form.css'
})
export class OfficeForm implements OnInit {
  private fb = inject(FormBuilder);
  private officesService = inject(OfficesService);

  @Input() data: Office | undefined;
  @Input() activeModal: any;

  form: FormGroup;
  isEdit = false;

  constructor() {
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
        this.activeModal.close(true);
      });
    } else {
      this.officesService.create(officeData).subscribe(() => {
        this.activeModal.close(true);
      });
    }
  }

  close() {
    this.activeModal.close(false);
  }
}

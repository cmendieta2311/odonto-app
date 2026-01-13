import { Component, Inject, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceCategory } from '../catalog.models';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.css'
})
export class CategoryDialogComponent implements OnInit {
  fb = inject(FormBuilder);

  @Input() data: { category?: ServiceCategory } = {};
  @Input() activeModal: any;

  form = this.fb.group({
    name: ['', Validators.required]
  });

  ngOnInit() {
    if (this.data.category) {
      this.form.patchValue({ name: this.data.category.name });
    }
  }

  save() {
    if (this.form.valid) {
      this.activeModal.close(this.form.value);
    }
  }

  close() {
    this.activeModal.close();
  }
}

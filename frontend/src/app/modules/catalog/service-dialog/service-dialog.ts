import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ServiceType, ServiceCategory, Service } from '../catalog.models';
import { CatalogService } from '../catalog.service';

@Component({
  selector: 'app-service-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './service-dialog.html',
  styleUrl: './service-dialog.css'
})
export class ServiceDialogComponent implements OnInit {
  fb = inject(FormBuilder);
  catalogService = inject(CatalogService);

  categories: ServiceCategory[] = [];
  filteredCategories: ServiceCategory[] = [];
  serviceTypes = Object.values(ServiceType);

  searchTerm = '';
  showDropdown = false;

  form = this.fb.group({
    categoryId: ['', Validators.required],
    code: ['', Validators.required],
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    type: [ServiceType.CONSULTORIO, Validators.required]
  });

  constructor(
    public dialogRef: MatDialogRef<ServiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { service?: Service }
  ) { }

  ngOnInit() {
    this.catalogService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.filteredCategories = cats;

      if (this.data.service) {
        const cat = this.categories.find(c => c.id === this.data.service?.categoryId);
        this.searchTerm = cat ? cat.name : '';
      }
    });

    if (this.data.service) {
      this.form.patchValue({
        categoryId: this.data.service.categoryId,
        code: this.data.service.code,
        name: this.data.service.name,
        price: this.data.service.price,
        type: this.data.service.type
      });
    }
  }

  filterCategories() {
    this.filteredCategories = this.categories.filter(cat =>
      cat.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.showDropdown = true;
  }

  selectCategory(cat: ServiceCategory) {
    this.form.patchValue({ categoryId: cat.id });
    this.searchTerm = cat.name;
    this.showDropdown = false;
  }

  onBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => this.showDropdown = false, 200);
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}

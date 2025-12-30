import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { CatalogService } from '../catalog.service';
import { Service, ServiceCategory } from '../catalog.models';
// import { ServiceDialogComponent } from '../service-dialog/service-dialog'; // Removed
import { CategoryDialogComponent } from '../category-dialog/category-dialog';


@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    MatSnackBarModule,

  ],
  templateUrl: './service-list.html',
  styleUrl: './service-list.css'
})
export class ServiceListComponent implements OnInit {
  catalogService = inject(CatalogService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  services: Service[] = [];
  categories: ServiceCategory[] = [];

  filteredServices: Service[] = [];
  selectedCategory: ServiceCategory | null = null;
  filtersOpen = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.catalogService.getCategories().subscribe(data => this.categories = data);
    this.catalogService.getServices().subscribe(data => {
      this.services = data;
      this.filterByCategory(this.selectedCategory);
    });
  }

  filterByCategory(category: ServiceCategory | null) {
    this.selectedCategory = category;
    this.filtersOpen = false; // Close dropdown on selection
    if (category) {
      this.filteredServices = this.services.filter(s => s.category?.id === category.id);
    } else {
      this.filteredServices = [...this.services];
    }
  }



  deleteService(service: Service) {
    if (confirm(`¿Eliminar servicio ${service.name}?`)) {
      this.catalogService.deleteService(service.id).subscribe(() => {
        this.loadData();
        this.snackBar.open('Servicio eliminado', 'Cerrar', { duration: 3000 });
      });
    }
  }

  // Category Actions
  openCategoryDialog(category?: ServiceCategory) {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: { category }
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        if (category) {
          this.catalogService.updateCategory(category.id, result).subscribe(() => this.loadData());
        } else {
          this.catalogService.createCategory(result).subscribe(() => this.loadData());
        }
      }
    });
  }
}

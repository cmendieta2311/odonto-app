import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CatalogService } from '../catalog.service';
import { Service, ServiceCategory, ServiceType } from '../catalog.models';
import { CategoryDialogComponent } from '../category-dialog/category-dialog';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';
import { exportToCsv } from '../../../shared/utils/csv-export.utils';

interface ServiceDisplay extends Service {
  categoryName: string;
}

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    CustomTableComponent
  ],
  templateUrl: './service-list.html',
  styleUrl: './service-list.css'
})
export class ServiceListComponent implements OnInit {
  catalogService = inject(CatalogService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  services: ServiceDisplay[] = [];
  filteredServices: ServiceDisplay[] = [];
  categories: ServiceCategory[] = [];
  serviceTypes = Object.values(ServiceType);

  // Pagination & Search
  page = 1;
  pageSize = 10;
  totalItems = 0;
  searchQuery = '';
  selectedCategoryId = '';
  selectedType = '';

  columns: TableColumn[] = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Descripción' },
    { key: 'categoryName', label: 'Categoría' },
    { key: 'type', label: 'Tipo' },
    { key: 'price', label: 'Precio' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.catalogService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.loadServices();
    });
  }

  loadServices() {
    this.catalogService.getServices().subscribe(data => {
      // Enrich data with category name for display
      this.services = data.map(s => ({
        ...s,
        categoryName: this.categories.find(c => c.id === s.categoryId)?.name || 'Sin Categoría'
      }));
      this.applyFilters();
    });
  }

  // Client-side filtering & pagination
  applyFilters() {
    let result = this.services;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategoryId) {
      result = result.filter(s => s.categoryId === this.selectedCategoryId);
    }

    if (this.selectedType) {
      result = result.filter(s => s.type === this.selectedType);
    }

    this.totalItems = result.length;

    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredServices = result.slice(start, end);
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.page = 1; // Reset to first page
    this.applyFilters();
  }

  onFilterChange() {
    this.page = 1;
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.page = page;
    this.applyFilters();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.applyFilters();
  }

  createService() {
    this.router.navigate(['/admin/catalog/new']);
  }

  editService(service: Service) {
    this.router.navigate(['/admin/catalog/edit', service.id]);
  }

  deleteService(service: Service) {
    if (confirm(`¿Eliminar servicio ${service.name}?`)) {
      this.catalogService.deleteService(service.id).subscribe(() => {
        this.loadServices();
        this.snackBar.open('Servicio eliminado', 'Cerrar', { duration: 3000 });
      });
    }
  }

  exportData() {
    const dataToExport = this.services.map(s => ({
      Codigo: s.code,
      Nombre: s.name,
      Categoria: s.categoryName,
      Tipo: s.type,
      Precio: s.price
    }));
    exportToCsv(dataToExport, 'catalogo_servicios.csv');
  }
}

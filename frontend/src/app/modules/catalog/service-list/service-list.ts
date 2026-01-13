import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';
import { ModalService } from '../../../shared/components/modal/modal.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

import { CatalogService } from '../catalog.service';
import { Service, ServiceCategory, ServiceType } from '../catalog.models';
// CategoryDialogComponent unused? Keeping import if needed or removing? 
// It was unused in code. Removing it.
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
    FormsModule,
    CustomTableComponent
  ],
  templateUrl: './service-list.html',
  styleUrl: './service-list.css'
})
export class ServiceListComponent implements OnInit {
  catalogService = inject(CatalogService);
  modalService = inject(ModalService);
  notificationService = inject(NotificationService);
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
  isLoading = false;

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
    this.isLoading = true;
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.loadServices();
      },
      error: () => this.isLoading = false
    });
  }

  loadServices() {
    this.isLoading = true;
    this.catalogService.getServices().subscribe({
      next: (data) => {
        // Enrich data with category name for display
        this.services = data.map(s => ({
          ...s,
          categoryName: this.categories.find(c => c.id === s.categoryId)?.name || 'Sin Categoría'
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
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
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Servicio',
        message: `¿Eliminar servicio ${service.name}?`,
        confirmText: 'Eliminar',
        color: 'warn'
      } as ConfirmationDialogData
    });

    modalRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.catalogService.deleteService(service.id).subscribe(() => {
          this.loadServices();
          this.notificationService.showSuccess('Servicio eliminado');
        });
      }
    });
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

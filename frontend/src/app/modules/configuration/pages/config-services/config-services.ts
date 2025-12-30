import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceCatalogService } from '../../service-catalog.service';
import { ServiceArea } from '../../../catalog/catalog.models';

@Component({
    selector: 'app-config-services',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './config-services.html'
})
export class ConfigServicesComponent implements OnInit {
    private serviceCatalog = inject(ServiceCatalogService);

    areas: ServiceArea[] = [];
    newAreaName = '';

    // Helper to store new category names by area ID
    newCategoryNames: { [areaId: string]: string } = {};

    // Edit State
    editingAreaId: string | null = null;
    renameAreaName = '';

    ngOnInit() {
        this.loadCatalog();
    }

    loadCatalog() {
        this.serviceCatalog.getAreas().subscribe({
            next: (areas) => this.areas = areas,
            error: (err) => console.error('Error loading catalog', err)
        });
    }

    areaCreationError: string | null = null;

    addArea() {
        if (!this.newAreaName.trim()) return;
        this.areaCreationError = null;

        this.serviceCatalog.createArea(this.newAreaName).subscribe({
            next: () => {
                this.newAreaName = '';
                this.loadCatalog();
            },
            error: (err) => {
                if (err.status === 409) {
                    this.areaCreationError = 'El nombre del área ya existe.';
                } else {
                    alert('Error al crear área: ' + err.message);
                }
            }
        });
    }

    startEdit(area: ServiceArea) {
        this.editingAreaId = area.id;
        this.renameAreaName = area.name;
    }

    cancelEdit() {
        this.editingAreaId = null;
        this.renameAreaName = '';
    }

    saveArea() {
        if (!this.editingAreaId || !this.renameAreaName.trim()) return;

        this.serviceCatalog.updateArea(this.editingAreaId, this.renameAreaName).subscribe({
            next: () => {
                this.cancelEdit();
                this.loadCatalog();
            },
            error: (err) => alert('Error al actualizar área: ' + err.message)
        });
    }

    deletingAreaId: string | null = null;

    deleteArea(id: string) {
        this.deletingAreaId = id;
    }

    confirmDelete() {
        if (!this.deletingAreaId) return;

        this.serviceCatalog.deleteArea(this.deletingAreaId).subscribe({
            next: () => {
                this.deletingAreaId = null;
                this.loadCatalog();
            },
            error: (err) => {
                alert('Error al eliminar área: ' + err.message);
                this.deletingAreaId = null;
            }
        });
    }

    cancelDelete() {
        this.deletingAreaId = null;
    }

    addCategory(areaId: string) {
        const name = this.newCategoryNames[areaId];
        if (!name?.trim()) return;

        this.serviceCatalog.createCategory(name, areaId).subscribe({
            next: () => {
                this.newCategoryNames[areaId] = '';
                this.loadCatalog();
            },
            error: (err) => alert('Error al crear categoría: ' + err.message)
        });
    }

    deleteCategory(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
        this.serviceCatalog.deleteCategory(id).subscribe({
            next: () => this.loadCatalog(),
            error: (err) => alert('Error al eliminar categoría: ' + err.message)
        });
    }
}

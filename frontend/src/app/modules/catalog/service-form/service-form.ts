import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../catalog.service';
import { ServiceType, ServiceCategory } from '../catalog.models';

@Component({
    selector: 'app-service-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './service-form.html'
})
export class ServiceFormComponent implements OnInit {
    fb = inject(FormBuilder);
    catalogService = inject(CatalogService);
    router = inject(Router);
    route = inject(ActivatedRoute);

    categories: ServiceCategory[] = [];
    filteredCategories: ServiceCategory[] = [];
    serviceTypes = Object.values(ServiceType);

    searchTerm = '';
    showDropdown = false;
    isSaving = false;
    isEditing = false;
    serviceId: string | null = null;
    priceDisplay = '';

    form = this.fb.group({
        categoryId: ['', Validators.required],
        code: ['', Validators.required],
        name: ['', Validators.required],
        price: [0, [Validators.required, Validators.min(0)]],
        type: [ServiceType.CONSULTORIO, Validators.required]
    });

    ngOnInit() {
        this.serviceId = this.route.snapshot.paramMap.get('id');
        this.isEditing = !!this.serviceId;

        this.catalogService.getCategories().subscribe(cats => {
            this.categories = cats;
            this.filteredCategories = cats;

            if (this.isEditing && this.serviceId) {
                this.loadService(this.serviceId);
            }
        });
    }

    loadService(id: string) {
        this.catalogService.getServices().subscribe(services => {
            const service = services.find(s => s.id === id);
            if (service) {
                this.form.patchValue({
                    categoryId: service.categoryId,
                    code: service.code,
                    name: service.name,
                    price: service.price,
                    type: service.type
                });
                const cat = this.categories.find(c => c.id === service.categoryId);
                this.priceDisplay = this.formatNumber(service.price);
            }
        });
    }

    formatNumber(value: number | string): string {
        if (!value) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    parseNumber(value: string): number {
        return Number(value.replace(/\./g, ''));
    }

    onPriceInput(event: any) {
        const input = event.target;
        let raw = input.value.replace(/\D/g, '');
        if (!raw) {
            this.priceDisplay = '';
            this.form.patchValue({ price: 0 });
            return;
        }

        const num = Number(raw);
        this.priceDisplay = this.formatNumber(raw);
        this.form.patchValue({ price: num });
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
        setTimeout(() => this.showDropdown = false, 200);
    }

    save() {
        if (this.form.invalid) return;

        this.isSaving = true;
        const formValue = this.form.value;

        // Type casting form value to any to match service signature if needed or clean up types
        const dto: any = { ...formValue }; // quick adaptation

        if (this.isEditing && this.serviceId) {
            this.catalogService.updateService(this.serviceId, dto).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.router.navigate(['/admin/catalog']);
                },
                error: (err) => {
                    console.error(err);
                    this.isSaving = false;
                }
            });
        } else {
            this.catalogService.createService(dto).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.router.navigate(['/admin/catalog']);
                },
                error: (err) => {
                    console.error(err);
                    this.isSaving = false;
                }
            });
        }
    }
}

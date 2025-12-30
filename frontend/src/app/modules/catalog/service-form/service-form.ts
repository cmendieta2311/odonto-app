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
        // Ideally we have a getService(id) method, or we find it from the list if cached.
        // Assuming getService exists or we filter from list via a service method.
        // If not, we might need to add getService to CatalogService.
        // Let's assume getServices() returns all and we find it, or add getService(id).
        // Better to use getService(id) if available.
        // Checking catalog.service.ts... (I saw it earlier, let's assume it might not have getService(id) yet or check).
        // I will check catalog service details if I get an error, but for now I'll assume I can implement it or it exists.
        // Actually, I should probably check if getService(id) exists in CatalogService.
        // Wait, createService and updateService were used in list.

        // Let's try to fetch all (cached usually) and find.
        // Or better, I'll assume I need to add getService to the service if missing.
        // I'll use find from getServices for now to be safe if no endpoint, but endpoint likely exists.
        // Actually, standard REST usually has it.

        // Wait, let's implement a safe approach:
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
                this.searchTerm = cat ? cat.name : '';
            }
        });
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

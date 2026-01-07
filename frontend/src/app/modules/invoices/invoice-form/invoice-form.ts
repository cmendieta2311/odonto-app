import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize, startWith, map } from 'rxjs/operators';
import { Subject, Observable, combineLatest } from 'rxjs';
import { InvoicesService } from '../invoices.service';
import { PatientsService } from '../../patients/patients.service';
import { CatalogService } from '../../catalog/catalog.service';
import { CreateInvoiceDto, InvoiceStatus } from '../invoices.models';

@Component({
    selector: 'app-invoice-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './invoice-form.html'
})
export class InvoiceFormComponent implements OnInit {
    invoiceForm: FormGroup;
    patients: any[] = [];
    services: any[] = [];
    filteredServices: any[] = [];
    isLoading = false;

    // Patient Search
    searchControl = new FormControl('');
    showSuggestions = false;
    isSearching = false;

    // Service Search
    serviceSearchControl = new FormControl('');
    showServiceSuggestions = false;

    issueDate = new Date(); // Current date for display

    constructor(
        private fb: FormBuilder,
        private invoicesService: InvoicesService,
        private router: Router,
        private patientsService: PatientsService,
        private catalogService: CatalogService
    ) {
        this.invoiceForm = this.fb.group({
            patientId: ['', Validators.required],
            type: ['CONTADO', Validators.required],
            items: this.fb.array([]),
            dueDate: [''],
            installments: [1]
        });
    }

    ngOnInit() {
        this.addItem(); // Start with one item
        this.setupSearch();
        this.setupServiceSearch();
        this.loadServices();

        // Subscribe to type changes to handle validation
        this.invoiceForm.get('type')?.valueChanges.subscribe(type => {
            const dueDateControl = this.invoiceForm.get('dueDate');
            const installmentsControl = this.invoiceForm.get('installments');

            if (type === 'CREDITO') {
                dueDateControl?.setValidators(Validators.required);
                installmentsControl?.setValidators([Validators.required, Validators.min(1)]);
            } else {
                dueDateControl?.clearValidators();
                installmentsControl?.clearValidators();
                // Reset values if needed, or keep them
                dueDateControl?.setValue('');
                installmentsControl?.setValue(1);
            }
            dueDateControl?.updateValueAndValidity();
            installmentsControl?.updateValueAndValidity();
        });
    }

    get items() {
        return this.invoiceForm.get('items') as FormArray;
    }

    addItem() {
        const itemGroup = this.fb.group({
            description: ['', Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            unitPrice: [0, [Validators.required, Validators.min(0)]],
            discount: [0, [Validators.min(0)]],
            taxRate: [10, [Validators.required, Validators.min(0)]]
        });
        this.items.push(itemGroup);
    }

    addServiceItem(service: any) {
        const itemGroup = this.fb.group({
            description: [service.name, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            unitPrice: [service.price, [Validators.required, Validators.min(0)]],
            discount: [0, [Validators.min(0)]],
            taxRate: [10, [Validators.required, Validators.min(0)]]
        });
        this.items.push(itemGroup);
    }

    removeItem(index: number) {
        this.items.removeAt(index);
    }

    calculateTotal(): number {
        return this.items.controls.reduce((sum, control) => {
            const qty = control.get('quantity')?.value || 0;
            const price = control.get('unitPrice')?.value || 0;
            const discount = control.get('discount')?.value || 0;
            const taxRate = control.get('taxRate')?.value || 0;

            const subtotal = (qty * price) - discount;
            const tax = subtotal * (taxRate / 100);

            return sum + (subtotal + tax);
        }, 0);
    }

    setupSearch() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            tap(() => {
                this.isSearching = true;
                this.showSuggestions = true;
            }),
            switchMap(term => this.patientsService.getPatients(1, 10, term || '').pipe(
                map(res => res.data),
                finalize(() => this.isSearching = false)
            ))
        ).subscribe({
            next: (data) => {
                this.patients = data;
                this.showSuggestions = true;
            },
            error: (err) => console.error('Error loading patients', err)
        });

        // Load initial list
        this.loadPatients();
    }

    setupServiceSearch() {
        this.serviceSearchControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filterServices(value || ''))
        ).subscribe(filtered => {
            this.filteredServices = filtered;
            this.showServiceSuggestions = !!this.serviceSearchControl.value;
        });
    }

    private _filterServices(value: string): any[] {
        const filterValue = value.toLowerCase();
        return this.services.filter(service => service.name.toLowerCase().includes(filterValue));
    }

    loadPatients() {
        this.patientsService.getPatients().subscribe(res => this.patients = res.data);
    }

    loadServices() {
        this.catalogService.getServices().subscribe(data => {
            this.services = data;
            this.filteredServices = data;
        });
    }

    selectPatient(patient: any) {
        this.invoiceForm.patchValue({ patientId: patient.id });
        this.searchControl.setValue(`${patient.firstName} ${patient.lastName} (${patient.dni})`, { emitEvent: false });
        this.showSuggestions = false;
    }

    selectService(service: any) {
        this.addServiceItem(service);
        this.serviceSearchControl.setValue('');
        this.showServiceSuggestions = false;
    }

    // Close suggestions when clicking outside
    onBlur() {
        setTimeout(() => this.showSuggestions = false, 200);
    }

    onServiceBlur() {
        setTimeout(() => this.showServiceSuggestions = false, 200);
    }

    save(status: InvoiceStatus = InvoiceStatus.PENDING) {
        if (this.invoiceForm.invalid) return;

        this.isLoading = true;
        const formValue = this.invoiceForm.value;

        // Map to DTO
        const dto: CreateInvoiceDto = {
            patientId: formValue.patientId,
            type: formValue.type,
            status: status,
            items: formValue.items.map((item: any) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                discount: Number(item.discount || 0),
                taxRate: Number(item.taxRate || 0)
            })),
            dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : undefined,
            installments: formValue.type === 'CREDITO' ? Number(formValue.installments) : undefined
        };

        this.invoicesService.create(dto).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.router.navigate(['/admin/invoices']);
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                alert('Error al crear factura');
            }
        });
    }

    protected readonly InvoiceStatusEnum = InvoiceStatus;
}

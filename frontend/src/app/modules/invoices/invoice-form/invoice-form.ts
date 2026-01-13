import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
        private route: ActivatedRoute,
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

        // Check for ID for editing
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isLoading = true;
            this.invoicesService.findOne(id).subscribe({
                next: (invoice) => {
                    this.patchForm(invoice);
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error(err);
                    this.isLoading = false;
                    alert('Error al cargar la factura');
                    this.router.navigate(['/admin/invoices']);
                }
            });
        } else {
            this.addItem(); // Start with one item if new
        }
    }

    patchForm(invoice: any) {
        // Patch main fields
        this.invoiceForm.patchValue({
            patientId: invoice.patientId,
            type: invoice.type,
            dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
            installments: invoice.installments || 1
        });

        // Handle Patient Search Control
        if (invoice.patient) {
            const p = invoice.patient;
            this.searchControl.setValue(`${p.firstName} ${p.lastName} (${p.dni})`, { emitEvent: false });
        }

        // Patch items
        this.items.clear(); // Clear existing items (e.g. from default addItem)
        if (invoice.items && invoice.items.length > 0) {
            invoice.items.forEach((item: any) => {
                const itemGroup = this.fb.group({
                    description: [item.description, Validators.required],
                    quantity: [item.quantity, [Validators.required, Validators.min(1)]],
                    unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
                    discount: [item.discount || 0, [Validators.min(0)]],
                    taxRate: [item.taxRate || 10, [Validators.required, Validators.min(0)]]
                });
                this.items.push(itemGroup);
            });
        } else {
            this.addItem();
        }
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

    getFormattedPrice(index: number): string {
        const control = this.items.at(index).get('unitPrice');
        if (!control || control.value == null || control.value === 0) return '';
        return control.value.toLocaleString('es-PY');
    }

    onPriceInput(value: string, index: number) {
        const numericValue = value.replace(/[^0-9]/g, '');
        const price = numericValue ? Number(numericValue) : 0;

        const control = this.items.at(index).get('unitPrice');
        if (control) {
            control.setValue(price, { emitEvent: false }); // Avoid loop if valueChanges subscribed
            // We don't have valueChanges relevant here, and updateValueAndValidity is implicitly called by setValue
            control.updateValueAndValidity();
        }
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

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.invoicesService.update(id, dto).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    this.router.navigate(['/admin/invoices']);
                },
                error: (err) => {
                    console.error(err);
                    this.isLoading = false;
                    alert('Error al actualizar factura');
                }
            });
        } else {
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
    }

    protected readonly InvoiceStatusEnum = InvoiceStatus;
}

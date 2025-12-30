import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Quote, QuoteStatus } from '../quotes.models';
import { QuotesService } from '../quotes.service';
import { PatientsService } from '../../patients/patients.service';
import { CatalogService } from '../../catalog/catalog.service';
import { Patient } from '../../patients/patients.models';
import { Service } from '../../catalog/catalog.models';

import { SystemConfigService } from '../../configuration/system-config.service';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatSnackBarModule
  ],
  templateUrl: './quote-form.html',
  styleUrl: './quote-form.css'
})
export class QuoteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quotesService = inject(QuotesService);
  private patientsService = inject(PatientsService);
  private catalogService = inject(CatalogService);
  private snackBar = inject(MatSnackBar);
  private configService = inject(SystemConfigService);

  patients: Patient[] = [];
  services: Service[] = [];
  groupedServices: { label: string, items: Service[] }[] = [];
  suggestedServices: Service[] = [];
  selectedPatient: Patient | null = null;
  quoteId: string | null = null;
  isEditMode = false;
  quote: Quote | null = null;
  QuoteStatus = QuoteStatus;

  installmentOptions: number[] = [1, 3, 6, 12]; // Default fallback
  calculateInterest = false;
  interestRate = 0;
  expirationDays = 15;

  searchControl = this.fb.control('');
  showPatientDropdown = false;
  isSearching = false;

  // new properties for service search
  serviceSearchControl = this.fb.control('');
  filteredServices: Service[] = [];
  showServiceDropdown = false;

  form = this.fb.group({
    patientId: ['', Validators.required],
    items: this.fb.array([]),
    observations: [''],
    financingEnabled: [false],
    initialPayment: [0],
    installments: [1]
  });

  total = 0;
  subtotal = 0;
  discounts = 0;
  financingInterest = 0;

  constructor() {
    console.log('QuoteFormComponent initialized as full-page component');
  }

  ngOnInit() {
    this.loadInitialData();
    this.loadSystemConfig();
    this.setupFormSubscriptions();

    this.quoteId = this.route.snapshot.paramMap.get('id');
    if (this.quoteId) {
      this.isEditMode = true;
      this.loadQuote(this.quoteId);
    }
  }

  private loadSystemConfig() {
    this.configService.getConfigs().subscribe({
      next: (configs) => {
        if (configs['billing_config']) {
          const billing = configs['billing_config'];
          if (Array.isArray(billing.allowedInstallments)) {
            this.installmentOptions = billing.allowedInstallments;
          }
          this.calculateInterest = billing.calculateInterest ?? false;
          this.interestRate = billing.interestRate ?? 0;
          this.expirationDays = billing.quoteValidityDays ?? 15;
          // Recalculate in case config loads after form changes (though unlikely to matter initially)
          this.calculateTotal();
        }
      }
    });
  }

  private loadInitialData() {
    // Start with empty patients or recently used
    this.catalogService.getServices().subscribe(s => {
      this.services = s;
      this.suggestedServices = s.slice(0, 4);

      // Group services by Area > Category
      const groups = new Map<string, Service[]>();

      s.forEach(service => {
        const areaName = service.category?.area?.name || 'Otras Areas';
        const categoryName = service.category?.name || 'General';
        const groupKey = `${areaName} > ${categoryName}`;

        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)?.push(service);
      });

      this.groupedServices = Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
      // Sort groups alphabetically
      this.groupedServices.sort((a, b) => a.label.localeCompare(b.label));
    });
  }

  private loadQuote(id: string) {
    this.quotesService.getQuote(id).subscribe(q => {
      this.quote = q;
      this.form.patchValue({
        patientId: q.patientId,
        financingEnabled: q.financingEnabled,
        initialPayment: q.initialPayment,
        installments: q.installments
      });
      this.selectedPatient = q.patient || null;
      if (this.selectedPatient) {
        this.searchControl.setValue(`${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`, { emitEvent: false });
        this.patients = [this.selectedPatient];
      }

      this.items.clear();
      q.items.forEach(item => this.addItem(item));
      this.calculateTotal();
    });
  }

  private setupFormSubscriptions() {
    this.searchControl.valueChanges.subscribe(value => {
      if (!value) {
        this.patients = [];
        this.showPatientDropdown = false;
        return;
      }
      this.searchPatients(value);
    });

    // Service Search Subscription
    this.serviceSearchControl.valueChanges.subscribe(value => {
      if (!value) {
        this.filteredServices = [];
        this.showServiceDropdown = false;
        return;
      }
      this.filterServices(value);
    });

    this.form.valueChanges.subscribe(() => this.calculateTotal());
  }

  filterServices(query: string) {
    const lowerQuery = query.toLowerCase();
    this.filteredServices = this.services.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.code?.toLowerCase().includes(lowerQuery)
    );
    this.showServiceDropdown = true;
  }

  getServiceForIndex(index: number): Service | undefined {
    const control = this.items.at(index);
    const serviceId = control?.get('serviceId')?.value;
    return this.services.find(s => s.id === serviceId);
  }

  addService(service: Service) {
    this.addItem({
      serviceId: service.id,
      quantity: 1,
      price: service.price
    });
    this.serviceSearchControl.setValue('', { emitEvent: false });
    this.showServiceDropdown = false;
    this.filteredServices = [];
  }

  searchPatients(query: string) {
    this.isSearching = true;
    this.showPatientDropdown = true;
    this.patientsService.getPatients(query).subscribe(results => {
      this.patients = results;
      this.isSearching = false;
    });
  }

  selectPatient(patient: Patient) {
    this.selectedPatient = patient;
    this.form.patchValue({ patientId: patient.id });
    this.searchControl.setValue(`${patient.firstName} ${patient.lastName}`, { emitEvent: false });
    this.showPatientDropdown = false;
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  addItem(item?: any) {
    const group = this.fb.group({
      serviceId: [item?.serviceId || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      discount: [item?.discount || 0],
      price: [{ value: item?.price || 0, disabled: true }]
    });

    group.get('serviceId')?.valueChanges.subscribe(id => {
      const service = this.services.find(s => s.id === id);
      if (service) {
        group.patchValue({ price: service.price }, { emitEvent: false });
        this.calculateTotal();
      }
    });

    this.items.push(group);
  }

  addSuggestedService(service: Service) {
    this.addItem({ serviceId: service.id, price: service.price });
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotal();
  }

  calculateTotal() {
    let sum = 0;
    this.items.controls.forEach(control => {
      const formGroup = control as FormGroup;
      const serviceId = formGroup.get('serviceId')?.value;
      const quantity = formGroup.get('quantity')?.value || 0;
      const service = this.services.find(s => s.id === serviceId);
      const price = service ? Number(service.price) : 0;
      sum += price * quantity;
    });

    this.subtotal = sum;
    this.discounts = 0;

    const financingEnabled = this.form.get('financingEnabled')?.value;
    if (financingEnabled && this.calculateInterest) {
      this.financingInterest = this.subtotal * (this.interestRate / 100);
    } else {
      this.financingInterest = 0;
    }

    this.total = this.subtotal - this.discounts + this.financingInterest;
  }

  isSaving = false;

  save(status: QuoteStatus = QuoteStatus.DRAFT) {
    if (this.form.invalid || this.isSaving) return;

    const rawValue = this.form.getRawValue();
    const patientId = rawValue.patientId;
    if (!patientId) return;

    this.isSaving = true;

    const payload = {
      patientId: patientId,
      items: rawValue.items.map((item: any) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        discount: Number(item.discount || 0)
      })),
      status: status,
      // Include financing data
      financingEnabled: rawValue.financingEnabled ?? false,
      initialPayment: Number(rawValue.initialPayment ?? 0),
      installments: Number(rawValue.installments ?? 1)
    };

    const action = this.isEditMode && this.quoteId
      ? this.quotesService.updateQuote(this.quoteId, payload)
      : this.quotesService.createQuote(payload);

    action.subscribe({
      next: () => {
        this.snackBar.open('Presupuesto guardado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/commercial/quotes']);
        this.isSaving = false;
      },
      error: () => {
        this.snackBar.open('Error al guardar presupuesto', 'Cerrar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/commercial/quotes']);
  }

  print() {
    window.print();
  }
}

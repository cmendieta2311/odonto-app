import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Quote, QuoteStatus } from '../quotes.models';
import { QuotesService } from '../quotes.service';
import { PatientsService } from '../../patients/patients.service';
import { CatalogService } from '../../catalog/catalog.service';
import { Patient } from '../../patients/patients.models';
import { Service } from '../../catalog/catalog.models';

import { SystemConfigService } from '../../configuration/system-config.service';
import { PdfService } from '../../../shared/services/pdf.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { ServiceCatalogDialogComponent } from './service-catalog-dialog.component';
import { PatientCreateDialogComponent } from '../../patients/patient-create-dialog/patient-create-dialog';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DialogModule
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
  private notificationService = inject(NotificationService);
  private configService = inject(SystemConfigService);
  private pdfService = inject(PdfService);
  private dialog = inject(Dialog);

  // ... (existing properties)

  openCatalog() {
    this.dialog.open<Service>(ServiceCatalogDialogComponent, {
      minWidth: '300px',
      data: {
        services: this.services
      }
    }).closed.subscribe(service => {
      if (service) {
        this.addService(service);
      }
    });
  }

  openNewPatientDialog() {
    this.dialog.open<Patient>(PatientCreateDialogComponent, {
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container'
    }).closed.subscribe(patient => {
      if (patient) {
        this.patients = [patient];
        this.selectPatient(patient);
      }
    });
  }

  patients: Patient[] = [];
  services: Service[] = [];
  groupedServices: { label: string, items: Service[] }[] = [];
  suggestedServices: Service[] = [];
  selectedPatient: Patient | null = null;
  quoteId: string | null = null;
  isEditMode = false;
  quote: Quote | null = null;
  QuoteStatus = QuoteStatus;

  installmentOptions: number[] = []; // Deprecated but kept for compatibility logic if needed
  minInstallments = 1;
  maxInstallments = 38;
  calculateInterest = false;
  interestRate = 0;
  expirationDays = 15;
  searchControl = this.fb.control('');
  showPatientDropdown = false;
  isSearching = false;

  clinicInfo: any = {};
  isReadOnly = false;

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
    installments: [1, [Validators.required, Validators.min(1), Validators.max(38)]],
    firstPaymentDate: [null as string | null]
  });

  formattedInitialPayment = '';

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

  onInitialPaymentInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formatInitialPayment(input.value);
  }

  formatInitialPayment(value: string) {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');

    if (!numericValue) {
      this.formattedInitialPayment = '';
      this.form.patchValue({ initialPayment: 0 }, { emitEvent: true });
      return;
    }

    const number = parseInt(numericValue, 10);
    this.formattedInitialPayment = new Intl.NumberFormat('es-PY').format(number);
    this.form.patchValue({ initialPayment: number }, { emitEvent: true });
  }

  private loadSystemConfig() {
    this.configService.getConfigs().subscribe({
      next: (configs) => {
        if (configs['billing_config']) {
          const billing = configs['billing_config'];

          this.minInstallments = billing.minInstallments ?? 1;
          this.maxInstallments = billing.maxInstallments ?? 38;

          this.form.get('installments')?.setValidators([
            Validators.required,
            Validators.min(this.minInstallments),
            Validators.max(this.maxInstallments)
          ]);
          this.form.get('installments')?.updateValueAndValidity();

          this.calculateInterest = billing.calculateInterest ?? false;
          this.interestRate = billing.interestRate ?? 0;
          this.expirationDays = billing.quoteValidityDays ?? 15;
          // Recalculate in case config loads after form changes (though unlikely to matter initially)
          this.calculateTotal();
        }
        if (configs['clinic_info']) {
          this.clinicInfo = configs['clinic_info'];
        }
        if (configs['clinicLogoUrl']) {
          this.clinicInfo = { ...this.clinicInfo, logoUrl: configs['clinicLogoUrl'] };
        }
      }
    });
  }

  private loadInitialData() {
    this.catalogService.getTopServices().subscribe(top => {
      if (top && top.length > 0) {
        this.suggestedServices = top;
      }
    });

    // Start with empty patients or recently used
    this.catalogService.getServices().subscribe(s => {
      this.services = s;
      // Fallback suggestions
      if (this.suggestedServices.length === 0) {
        this.suggestedServices = s.slice(0, 4);
      }

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
        installments: q.installments,
        observations: q.observations,
        firstPaymentDate: q.firstPaymentDate ? new Date(q.firstPaymentDate).toISOString().split('T')[0] : null
      });

      // Initialize formatted payment
      if (q.initialPayment) {
        this.formatInitialPayment(q.initialPayment.toString());
      }

      this.selectedPatient = q.patient || null;
      if (this.selectedPatient) {
        this.searchControl.setValue(`${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`, { emitEvent: false });
        this.patients = [this.selectedPatient];
      }

      this.items.clear();
      q.items.forEach(item => this.addItem(item));
      this.calculateTotal();

      if ([QuoteStatus.APPROVED, QuoteStatus.CONVERTED].includes(q.status)) {
        this.isReadOnly = true;
        this.form.disable();
        this.searchControl.disable();
        this.serviceSearchControl.disable();
      }
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

    this.form.get('firstPaymentDate')?.valueChanges.subscribe(() => this.calculateSchedule());

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
    this.patientsService.getPatients(1, 10, query).subscribe(res => {
      this.patients = res.data;
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
      discount: [item?.discount || 0, [Validators.min(0), Validators.max(100)]],
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
    let totalDiscount = 0;

    this.items.controls.forEach(control => {
      const formGroup = control as FormGroup;
      const serviceId = formGroup.get('serviceId')?.value;
      const quantity = formGroup.get('quantity')?.value || 0;
      const discountPercent = formGroup.get('discount')?.value || 0;

      const service = this.services.find(s => s.id === serviceId);
      const price = service ? Number(service.price) : 0;

      const itemTotal = price * quantity;
      const itemDiscount = itemTotal * (discountPercent / 100);

      sum += itemTotal;
      totalDiscount += itemDiscount;
    });

    this.subtotal = sum;
    this.discounts = totalDiscount;

    const financingEnabled = this.form.get('financingEnabled')?.value;
    if (financingEnabled && this.calculateInterest) {
      this.financingInterest = this.subtotal * (this.interestRate / 100);
    } else {
      this.financingInterest = 0;
    }

    this.total = this.subtotal - this.discounts + this.financingInterest;

    this.calculateSchedule();
  }

  paymentSchedule: { installment: number, dueDate: Date, amount: number }[] = [];

  calculateSchedule() {
    this.paymentSchedule = [];
    const financingEnabled = this.form.get('financingEnabled')?.value;

    if (!financingEnabled) return;

    const installments = this.form.get('installments')?.value || 1;
    const initialPayment = this.form.get('initialPayment')?.value || 0;

    // Amount to finance is Total minus Initial Payment
    // Note: total already includes interest if applicable
    const financedAmount = Math.max(0, this.total - initialPayment);

    if (financedAmount <= 0) return;

    const installmentAmount = financedAmount / installments;
    const today = new Date();

    // Determine start date: use firstPaymentDate if set, otherwise default to next month
    let startDate = new Date();
    const firstPaymentDateVal = this.form.get('firstPaymentDate')?.value;

    if (firstPaymentDateVal) {
      // If user selected a date, that's the first payment date
      startDate = new Date(firstPaymentDateVal);
      // Adjust startDate to be "0th" payment so loop adds months correctly? 
      // Actually loop adds 'i' months. If i=1, date + 1 month.
      // If user sets specific date X, they usually mean "First payment is on X".
      // So ensuring the loop produces X for i=1 requires backing up 1 month or handling logic differently.
      // Let's adjust logic:
      // Base date = (Selected Date) - 1 month
      startDate.setMonth(startDate.getMonth() - 1);
    }

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i); // monthly payments

      this.paymentSchedule.push({
        installment: i,
        dueDate: dueDate,
        amount: installmentAmount
      });
    }
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
      installments: Number(rawValue.installments ?? 1),
      observations: rawValue.observations ?? undefined,
      firstPaymentDate: rawValue.firstPaymentDate ? new Date(rawValue.firstPaymentDate).toISOString() : null
    };

    const action = this.isEditMode && this.quoteId
      ? this.quotesService.updateQuote(this.quoteId, payload)
      : this.quotesService.createQuote(payload);

    action.subscribe({
      next: () => {
        this.notificationService.showSuccess('Presupuesto guardado exitosamente');
        this.router.navigate(['/commercial/quotes']);
        this.isSaving = false;
      },
      error: () => {
        this.notificationService.showError('Error al guardar presupuesto');
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

  downloadPdf() {
    if (!this.quote) return;
    this.configService.getConfigs().subscribe(configs => {
      const clinicInfo = {
        ...configs['clinic_info'],
        logoUrl: configs['clinicLogoUrl']
      };
      this.pdfService.generateQuotePdf(this.quote!, clinicInfo, this.expirationDays);
    });
  }


  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ignore if input is focused, EXCEPT for Alt+ keys which act as commands
    const isInput = event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement;

    if (event.code === 'Escape') {
      // If a dialog is open (like New Patient), let the dialog handle Esc and do nothing here
      if (this.dialog.openDialogs.length > 0) {
        return;
      }

      // Always allow Escape to cancel/back unless strictly modal (which this component isn't really, it's a page)
      event.preventDefault();
      this.cancel();
      return;
    }

    // Commands with Alt
    if (event.altKey) {
      if (event.code === 'KeyG') {
        // Alt + G -> Accept/Save
        event.preventDefault();
        this.save(QuoteStatus.APPROVED);
      } else if (event.code === 'KeyB') {
        // Alt + B -> Draft (Borrador)
        event.preventDefault();
        this.save(QuoteStatus.DRAFT);
      }
    }
  }
}

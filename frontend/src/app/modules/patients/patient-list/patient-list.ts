import { Component, OnInit, inject } from '@angular/core';
import { BaseListComponent } from '../../../shared/classes/base-list.component';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PatientsService } from '../patients.service';
import { Patient } from '../patients.models';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatSnackBarModule,
    CustomTableComponent,
    FormsModule
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientListComponent extends BaseListComponent<Patient> implements OnInit {
  private patientsService = inject(PatientsService);
  private router = inject(Router);

  columns: TableColumn[] = [
    { key: 'patient', label: 'Paciente' },
    { key: 'dni', label: 'Documento' },
    { key: 'contact', label: 'Contacto', hiddenOnMobile: true },
    { key: 'address', label: 'Ubicación', hiddenOnMobile: true }
  ];

  override ngOnInit() {
    super.ngOnInit();
    this.calculateColumns();
    window.addEventListener('resize', () => this.calculateColumns());
  }

  calculateColumns() {
    // Re-assign columns to trigger change detection if needed, or keep static.
  }

  loadData() {
    this.isLoading = true;
    this.patientsService.getPatients(this.page, this.pageSize, this.searchQuery)
      .subscribe({
        next: (res) => {
          this.data = res.data;
          this.totalItems = res.meta.total;
          this.isLoading = false;
        },
        error: (err) => this.handleError(err)
      });
  }

  createPatient() {
    this.router.navigate(['/reception/patients/new']);
  }

  viewPatient(patient: Patient) {
    this.router.navigate(['/reception/patients', patient.id]);
  }

  editPatient(patient: Patient) {
    this.router.navigate(['/reception/patients', patient.id, 'edit']);
  }

  deletePatient(patient: Patient) {
    if (confirm(`¿Eliminar paciente ${patient.firstName} ${patient.lastName}?`)) {
      this.patientsService.deletePatient(patient.id).subscribe(() => {
        this.loadData();
        this.snackBar.open('Paciente eliminado', 'Cerrar', { duration: 3000 });
      });
    }
  }
}

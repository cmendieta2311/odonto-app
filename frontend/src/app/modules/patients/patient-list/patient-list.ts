import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink, Router } from '@angular/router';

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
    CustomTableComponent
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientListComponent implements OnInit {
  private patientsService = inject(PatientsService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  patients: Patient[] = [];

  columns: TableColumn[] = [
    { key: 'patient', label: 'Paciente' },
    { key: 'dni', label: 'Documento' },
    { key: 'contact', label: 'Contacto', hiddenOnMobile: true },
    { key: 'address', label: 'Ubicación' }
  ];

  ngOnInit() {
    this.calculateColumns();
    window.addEventListener('resize', () => this.calculateColumns());
    this.loadData();
  }

  calculateColumns() {
    // Re-assign columns to trigger change detection if needed, or keep static.
    // For now keeping static definition above is fine, but if we wanted dynamic responsiveness in TS:
  }

  loadData() {
    this.patientsService.getPatients().subscribe(data => this.patients = data);
  }

  createPatient() {
    this.router.navigate(['/reception/patients/new']);
  }

  editPatient(patient: Patient) {
    this.router.navigate(['/reception/patients/edit', patient.id]);
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

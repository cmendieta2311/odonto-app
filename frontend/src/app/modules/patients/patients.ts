import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Patients {

}

import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list';
import { PatientFormComponent } from './patient-form/patient-form'; // No change needed if default export is used or if PatientDetail is exported from its file
import { PatientDetailComponent } from './patient-detail/patient-detail.component'; // Assuming path

export const patientRoutes: Routes = [
  {
    path: '',
    component: PatientListComponent
  },
  {
    path: 'new',
    component: PatientFormComponent
  },
  {
    path: ':id/edit', // Moved Edit BEFORE :id to prevent shadowing
    component: PatientFormComponent
  },
  {
    path: ':id',
    component: PatientDetailComponent
  }
];

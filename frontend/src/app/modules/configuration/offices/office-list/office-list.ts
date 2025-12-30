import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficesService } from '../offices.service';
import { Office } from '../office.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OfficeForm } from '../office-form/office-form'; // check filename later

@Component({
  selector: 'app-office-list',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './office-list.html',
  styleUrl: './office-list.css'
})
export class OfficeList implements OnInit {
  private officesService = inject(OfficesService);
  private dialog = inject(MatDialog);

  offices: Office[] = [];

  ngOnInit() {
    this.loadOffices();
  }

  loadOffices() {
    this.officesService.findAll().subscribe(data => {
      this.offices = data;
    });
  }

  openOfficeForm(office?: Office) {
    const dialogRef = this.dialog.open(OfficeForm, {
      width: '500px',
      data: office
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOffices();
      }
    });
  }

  deleteOffice(office: Office) {
    if (confirm(`¿Estás seguro de eliminar el consultorio ${office.name}?`)) {
      this.officesService.delete(office.id).subscribe(() => {
        this.loadOffices();
      });
    }
  }
}

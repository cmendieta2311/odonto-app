import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficesService } from '../offices.service';
import { Office } from '../office.model';
import { OfficeForm } from '../office-form/office-form'; // check filename later
import { ModalService } from '../../../../shared/components/modal/modal.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-office-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './office-list.html',
  styleUrl: './office-list.css'
})
export class OfficeList implements OnInit {
  private officesService = inject(OfficesService);
  private modalService = inject(ModalService);

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
    const modalRef = this.modalService.open(OfficeForm, {
      width: '500px',
      data: office
    });

    modalRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadOffices();
      }
    });
  }

  deleteOffice(office: Office) {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Consultorio',
        message: `¿Estás seguro de eliminar el consultorio ${office.name}?`,
        confirmText: 'Eliminar',
        color: 'warn'
      } as ConfirmationDialogData
    });

    modalRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.officesService.delete(office.id).subscribe(() => {
          this.loadOffices();
        });
      }
    });
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { AppointmentDialogComponent } from './components/appointment-dialog/appointment-dialog.component';
import { AppointmentsService, Appointment } from './services/appointments.service';
import { UsersService } from '../admin/users/users.service';
import { User } from '../admin/users/users.models';

@Component({
    selector: 'app-agenda',
    standalone: true,
    imports: [CommonModule, FormsModule, CalendarViewComponent, AppointmentDialogComponent],
    templateUrl: './agenda.html',
})
export class AgendaComponent implements OnInit {
    private appointmentsService = inject(AppointmentsService);
    private usersService = inject(UsersService);

    appointments: Appointment[] = [];
    currentDate = new Date();
    view: 'day' | 'week' | 'month' = 'week';

    // Filters
    dentists: User[] = [];
    selectedDentistId: string = '';
    searchTerm: string = '';

    // Dialog State
    isDialogOpen = false;
    selectedDateStr = '';
    selectedTimeStr = '';
    selectedAppointment: Appointment | null = null; // To hold appt being edited

    ngOnInit() {
        this.loadAppointments();
        this.loadDentists();
    }

    loadDentists() {
        this.usersService.getUsers('ODONTOLOGO').subscribe(users => {
            this.dentists = users;
        });
    }

    get filteredAppointments(): Appointment[] {
        return this.appointments.filter(appt => {
            // Filter by Dentist
            if (this.selectedDentistId && appt.dentistId !== this.selectedDentistId) {
                return false;
            }

            // Filter by Patient Name (Search)
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                const title = (appt.title || '').toLowerCase();
                // We could also filter by patient name if populated inside appt.patient
                // const patientName = appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}`.toLowerCase() : '';
                return title.includes(term);
            }

            return true;
        });
    }

    loadAppointments() {
        const start = new Date(this.currentDate);
        const end = new Date(this.currentDate);

        if (this.view === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (this.view === 'week') {
            // Start of week (Monday)
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);

            // End of week (Sunday)
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else if (this.view === 'month') {
            // Start of month
            start.setDate(1);
            start.setHours(0, 0, 0, 0);

            // End of month
            end.setMonth(end.getMonth() + 1);
            end.setDate(0); // Last day of previous month (which is the current month since we added 1)
            end.setHours(23, 59, 59, 999);
        }

        this.appointmentsService.getAppointments(start.toISOString(), end.toISOString())
            .subscribe(data => {
                this.appointments = data;
            });
    }

    previousWeek() {
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() - 7);
        this.currentDate = d;
        this.loadAppointments();
    }

    nextWeek() {
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() + 7);
        this.currentDate = d;
        this.loadAppointments();
    }

    goToToday() {
        this.currentDate = new Date();
        this.loadAppointments();
    }

    openNewAppointmentDialog() {
        const now = new Date();
        this.selectedDateStr = now.toISOString().split('T')[0];
        this.selectedTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        this.selectedAppointment = null; // Clear any selected appt
        this.isDialogOpen = true;
    }

    onSlotClick(event: { date: Date, time: string }) {
        this.selectedDateStr = event.date.toISOString().split('T')[0];
        this.selectedTimeStr = event.time;
        this.selectedAppointment = null; // Creating new
        this.isDialogOpen = true;
    }

    onSaveAppointment(data: any) {
        if (data.id) {
            // Update
            const { id, ...updateData } = data;
            this.appointmentsService.updateAppointment(id, updateData).subscribe(() => {
                this.loadAppointments();
                this.isDialogOpen = false;
                this.selectedAppointment = null;
            });
        } else {
            // Create
            this.appointmentsService.createAppointment(data).subscribe(() => {
                this.loadAppointments();
                this.isDialogOpen = false;
            });
        }
    }

    onAppointmentClick(appt: Appointment) {
        this.selectedAppointment = appt;
        this.isDialogOpen = true;
    }

    onDeleteAppointment(id: string) {
        this.appointmentsService.deleteAppointment(id).subscribe(() => {
            this.loadAppointments();
            this.isDialogOpen = false;
            this.selectedAppointment = null;
        });
    }

    onChangeView(event: { view: 'day' | 'week' | 'month', date: Date }) {
        this.view = event.view;
        this.currentDate = event.date;
        this.loadAppointments();
    }
}

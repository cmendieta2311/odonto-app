import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../services/appointments.service';

@Component({
    selector: 'app-calendar-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar-view.html',
})
export class CalendarViewComponent implements OnChanges {
    @Input() currentDate: Date = new Date();
    @Input() view: 'day' | 'week' | 'month' = 'week';
    @Input() appointments: Appointment[] = [];
    @Output() slotClick = new EventEmitter<{ date: Date, time: string }>();
    @Output() appointmentClick = new EventEmitter<Appointment>();
    @Output() changeView = new EventEmitter<{ view: 'day' | 'week' | 'month', date: Date }>();

    weekDays: { name: string, dayNumber: number, date: Date }[] = [];
    monthDays: { date: Date, isCurrentMonth: boolean, events: Appointment[] }[] = [];
    hours: string[] = [];

    // Settings
    startHour = 8;
    endHour = 20;
    hourHeight = 80; // px per hour

    get currentTimePercentage(): number {
        const now = new Date();
        const start = new Date(now);
        start.setHours(this.startHour, 0, 0, 0);
        const totalMinutes = (this.endHour - this.startHour) * 60;
        const currentMinutes = (now.getHours() * 60 + now.getMinutes()) - (this.startHour * 60);
        return (currentMinutes / totalMinutes) * 100;
    }

    get currentTime(): string {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    constructor() {
        this.generateHours();
        // Initial generation will happen in ngOnChanges
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentDate'] || changes['view'] || changes['appointments']) {
            this.generateLayout();
        }
    }

    generateHours() {
        this.hours = [];
        for (let i = this.startHour; i <= this.endHour; i++) {
            this.hours.push(`${i.toString().padStart(2, '0')}:00`);
        }
    }

    generateLayout() {
        if (this.view === 'month') {
            this.generateMonth();
        } else {
            this.generateDays();
        }
    }

    generateDays() {
        this.weekDays = [];
        const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

        if (this.view === 'day') {
            const d = new Date(this.currentDate);
            this.weekDays.push({
                name: days[d.getDay()],
                dayNumber: d.getDate(),
                date: d
            });
        } else {
            // Week View
            const current = new Date(this.currentDate);
            const day = current.getDay();
            const diff = current.getDate() - day + (day == 0 ? -6 : 1);
            const monday = new Date(current.setDate(diff));

            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                // Adjust index for days array (Monday is 1, Sunday is 0)
                const dayIndex = d.getDay();
                this.weekDays.push({
                    name: days[dayIndex],
                    dayNumber: d.getDate(),
                    date: d
                });
            }
        }
    }

    generateMonth() {
        this.monthDays = [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Days from previous month to fill the first row
        // Monday based: Monday=1 ... Sunday=0. 
        // We want Monday as first col.
        let startDay = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
        if (startDay === 0) startDay = 7; // Make Sunday 7
        // Monday=1. So need (startDay - 1) padding days.

        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - (startDay - 1));

        // 6 rows * 7 cols = 42 days grid
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isCurrentMonth = date.getMonth() === month;
            const events = this.getAppointmentsForDay(date);

            this.monthDays.push({
                date,
                isCurrentMonth,
                events
            });
        }
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    getAppointmentsForDay(date: Date): Appointment[] {
        return this.appointments.filter(appt => {
            const apptDate = new Date(appt.startTime);
            return apptDate.getDate() === date.getDate() &&
                apptDate.getMonth() === date.getMonth() &&
                apptDate.getFullYear() === date.getFullYear();
        });
    }

    getApptTop(startTime: string): number {
        const date = new Date(startTime);
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const minutesFromStart = ((hour - this.startHour) * 60) + minutes;
        return (minutesFromStart / 60) * this.hourHeight;
    }

    getApptHeight(startTime: string, endTime: string): number {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return (durationMinutes / 60) * this.hourHeight;
    }

    getTopPosition(time: string): number {
        const [h, m] = time.split(':').map(Number);
        const minutesFromStart = ((h - this.startHour) * 60) + m;
        return (minutesFromStart / 60) * this.hourHeight;
    }

    handleMonthDayClick(date: Date) {
        this.changeView.emit({ view: 'day', date: date });
    }

    handleSlotClick(date: Date, time: string) {
        const [h, m] = time.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(h, m, 0, 0);
        this.slotClick.emit({ date: slotDate, time });
    }

    handleAppointmentClick(appt: Appointment) {
        this.appointmentClick.emit(appt);
    }

    getAppointmentClasses(appt: Appointment): string {
        switch (appt.status) {
            case 'CONFIRMED':
                return 'bg-green-50 dark:bg-green-900/20 border-green-500 text-slate-800 dark:text-slate-100';
            case 'PENDING':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-slate-800 dark:text-slate-100';
            case 'CANCELLED':
                return 'bg-red-50 dark:bg-red-900/10 border-red-500 text-slate-800 dark:text-slate-100 line-through opacity-75';
            case 'COMPLETED':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-slate-800 dark:text-slate-100';
            case 'NO_SHOW':
                return 'bg-gray-100 dark:bg-gray-800 border-gray-500 text-gray-600 dark:text-gray-400';
            default:
                return 'bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-800 dark:text-slate-100';
        }
    }
}

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../../modules/quotes/quotes.models';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    generateQuotePdf(quote: Quote, clinicInfo: any) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(0, 102, 204); // Blue color
        doc.text(clinicInfo?.businessName || 'DentalApp Clinic', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        const address = clinicInfo?.address || 'Dirección de la Clínica';
        const phone = clinicInfo?.phone || 'Tel: (0981) 123-456';
        const email = clinicInfo?.email || 'contacto@clinica.com';

        doc.text(address, 14, 28);
        doc.text(`${phone} | ${email}`, 14, 33);

        // --- Title & Quote Info ---
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('PRESUPUESTO', pageWidth - 14, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Nro: #${quote.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString()}`, pageWidth - 14, 33, { align: 'right' });

        // --- Patient Info ---
        doc.setDrawColor(200);
        doc.line(14, 40, pageWidth - 14, 40);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Datos del Paciente', 14, 50);

        doc.setFontSize(10);
        doc.setTextColor(80);
        if (quote.patient) {
            doc.text(`Nombre: ${quote.patient.firstName} ${quote.patient.lastName}`, 14, 58);
            doc.text(`DNI: ${quote.patient.dni}`, 14, 63);
            if (quote.patient.phone) doc.text(`Teléfono: ${quote.patient.phone}`, 14, 68);
        } else {
            doc.text('Paciente no registrado', 14, 58);
        }

        // --- Items Table ---
        const tableBody = quote.items.map(item => [
            item.service?.name || 'Servicio',
            item.quantity,
            `Gs. ${Number(item.price).toLocaleString('es-PY')}`,
            `${(item.discount || 0) > 0 ? (item.discount || 0) + '%' : '-'}`,
            `Gs. ${this.calculateItemTotal(item).toLocaleString('es-PY')}`
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Servicio', 'Cant.', 'Precio Unit.', 'Desc.', 'Total']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Servicio
                1: { cellWidth: 15, halign: 'center' }, // Cant
                2: { cellWidth: 25, halign: 'right' }, // Precio
                3: { cellWidth: 15, halign: 'center' }, // Desc
                4: { cellWidth: 25, halign: 'right' }  // Total
            }
        });

        // --- Financial Summary ---
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const rightMargin = pageWidth - 14;

        doc.setFontSize(10);
        doc.setTextColor(0);

        const subtotal = quote.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
        const total = Number(quote.total);
        // Rough calculation if not stored directly
        // Ideally we pass exact calculated values from component, but replicating simple logic here is ok for now.

        // Align numbers to the right
        this.printSummaryLine(doc, 'Subtotal:', `Gs. ${subtotal.toLocaleString('es-PY')}`, finalY, rightMargin);

        let currentY = finalY + 6;

        if (quote.financingEnabled) {
            this.printSummaryLine(doc, 'Financiamiento:', 'Si', currentY, rightMargin);
            currentY += 6;
            if ((quote.initialPayment || 0) > 0) {
                this.printSummaryLine(doc, 'Entrega Inicial:', `Gs. -${Number(quote.initialPayment).toLocaleString('es-PY')}`, currentY, rightMargin);
                currentY += 6;
            }
            this.printSummaryLine(doc, 'Cuotas:', `${quote.installments} cuotas`, currentY, rightMargin);
            currentY += 6;
        }

        // Grand Total
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 204);
        this.printSummaryLine(doc, 'TOTAL:', `Gs. ${total.toLocaleString('es-PY')}`, currentY + 2, rightMargin);

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generado por DentalApp', 14, pageHeight - 10);
        doc.text(`Página 1 de 1`, pageWidth - 14, pageHeight - 10, { align: 'right' });

        // Save
        doc.save(`presupuesto_${quote.id.substring(0, 6)}.pdf`);
    }

    private calculateItemTotal(item: any): number {
        const price = Number(item.price);
        const sub = price * item.quantity;
        if (item.discount) {
            return sub - (sub * (item.discount / 100));
        }
        return sub;
    }

    private printSummaryLine(doc: jsPDF, label: string, value: string, y: number, rightX: number) {
        doc.text(label, rightX - 60, y);
        doc.text(value, rightX, y, { align: 'right' });
    }
}

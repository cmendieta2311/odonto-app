import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../../modules/quotes/quotes.models';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    async generateQuotePdf(quote: Quote, clinicInfo: any) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // --- Header ---
        let headerY = 20;

        // Logo
        if (clinicInfo?.logoUrl) {
            try {
                const imgData = await this.getBase64ImageFromURL(clinicInfo.logoUrl);
                if (imgData) {
                    doc.addImage(imgData, 14, 10, 30, 30, undefined, 'FAST');
                }
            } catch (e) {
                console.error('Error loading logo for PDF', e);
            }
        }

        const textX = clinicInfo?.logoUrl ? 50 : 14;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 169, 224); // Primary Blue
        doc.text(clinicInfo?.businessName || 'DentalApp Clinic', textX, 20);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);

        headerY = 26;
        const ruc = clinicInfo?.ruc || '';
        const address = clinicInfo?.address || 'Dirección de la Clínica';
        const phone = clinicInfo?.phone || '';
        const email = clinicInfo?.email || '';

        if (ruc) {
            doc.text(`RUC: ${ruc}`, textX, headerY);
            headerY += 5;
        }

        doc.text(address, textX, headerY);
        headerY += 5;

        let contactInfo = '';
        if (phone) contactInfo += `Tel: ${phone}`;
        if (email) contactInfo += (contactInfo ? ' | ' : '') + `${email}`;

        if (contactInfo) {
            doc.text(contactInfo, textX, headerY);
        }

        // --- Title & Quote Info ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50);
        doc.text('PRESUPUESTO', pageWidth - 14, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Nro: #${quote.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString()}`, pageWidth - 14, 33, { align: 'right' });

        // --- Patient Info ---
        doc.setDrawColor(230);
        doc.line(14, 45, pageWidth - 14, 45);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text('Datos del Paciente', 14, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        if (quote.patient) {
            doc.text(`Nombre(s) y Apellido(s): ${quote.patient.firstName} ${quote.patient.lastName}`, 14, 63);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Documento: ${quote.patient.dni} ${quote.patient.phone ? ' | Tel: ' + quote.patient.phone : ''}`, 14, 68);
        } else {
            doc.text('Paciente no registrado', 14, 63);
        }

        let currentY = 80;

        // --- Services Section (Image 2 style) ---
        // Header with Icon
        // doc.setFillColor(0, 169, 224);
        // doc.circle(17, currentY - 1, 3, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text('Servicios Incluidos', 14, currentY);

        // Table
        const tableBody = quote.items.map(item => [
            `${item.service?.name || 'Servicio'}\n${item.service?.code || ''}`,
            item.quantity,
            `Gs. ${Number(item.price).toLocaleString('es-PY')}`,
            `${(item.discount || 0) > 0 ? (item.discount || 0) + '%' : '0%'}`,
            `Gs. ${this.calculateItemTotal(item).toLocaleString('es-PY')}`
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Servicio', 'Cant.', 'P. Unitario', 'Desc %', 'Total']],
            body: tableBody,
            theme: 'plain', // Cleaner look
            headStyles: {
                fillColor: [248, 250, 252],
                textColor: [100, 116, 139],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 2
            },
            bodyStyles: {
                textColor: [30, 41, 59],
                fontSize: 9,
                cellPadding: 2,
                valign: 'middle',
                lineColor: [241, 245, 249],
                lineWidth: { bottom: 0.1 }
            },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' }, // Service Name
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 30, halign: 'right', textColor: [100, 116, 139] },
                3: { cellWidth: 20, halign: 'center', textColor: [100, 116, 139] },
                4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                // Formatting for Code subtitle (row index > 0 means body)
                if (data.section === 'body' && data.column.index === 0) {
                    // We handled content with \n, styling usually automatic
                }
            }
        });

        const lastTableY = (doc as any).lastAutoTable.finalY;

        // --- Summary Totals ---
        const subtotal = quote.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
        const total = Number(quote.total);

        // Render simple totals below services
        currentY = lastTableY + 10;
        const rightMargin = pageWidth - 14;

        // Check for page break if totals don't fit
        if (currentY + 40 > pageHeight) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        this.printSummaryLine(doc, 'Subtotal:', `Gs. ${subtotal.toLocaleString('es-PY')}`, currentY, rightMargin);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        this.printSummaryLine(doc, 'TOTAL:', `Gs. ${total.toLocaleString('es-PY')}`, currentY + 8, rightMargin);

        currentY += 20;

        // --- Payment Schedule (Image 1 style) ---
        if (quote.financingEnabled) {
            const installments = quote.installments || 1;
            const initialPayment = Number(quote.initialPayment || 0);
            const financedAmount = Math.max(0, total - initialPayment);

            if (financedAmount > 0) {
                // Check for page break
                if (currentY + 60 > pageHeight) {
                    doc.addPage();
                    currentY = 20;
                }

                // Header
                // doc.setFillColor(0, 169, 224);
                // doc.rect(14, currentY - 5, 5, 5, 'F'); // Square icon
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30);
                doc.text('Cronograma de Pagos (Informativo)', 14, currentY);

                currentY += 10;

                // Summary Cards (Rounded Rects)
                const cardWidth = (pageWidth - 28 - 10) / 3; // 3 cards, 5 gaps
                const cardHeight = 20;
                const cardY = currentY;

                // Card 1: Initial Payment
                this.drawSummaryCard(doc, 14, cardY, cardWidth, cardHeight, 'CUOTA INICIAL', `Gs. ${initialPayment.toLocaleString('es-PY')}`, 'Pagada al firmar');

                // Card 2: Total Financed
                this.drawSummaryCard(doc, 14 + cardWidth + 5, cardY, cardWidth, cardHeight, 'TOTAL A FINANCIAR', `Gs. ${financedAmount.toLocaleString('es-PY')}`, `En ${installments} cuotas`);

                // Card 3: Due Day
                // Calculate estimated day based on today + 30 days
                const nextDueDate = new Date();
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                const dueDay = nextDueDate.getDate();
                this.drawSummaryCard(doc, 14 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, 'DÍA DE VENCIMIENTO', `Día ${dueDay}`, 'De cada mes');

                currentY += cardHeight + 10;

                // Schedule Table
                const installmentAmount = financedAmount / installments;
                const today = new Date();
                const scheduleRows = [];

                for (let i = 1; i <= installments; i++) {
                    const dueDate = new Date(today);
                    dueDate.setMonth(dueDate.getMonth() + i);
                    scheduleRows.push([
                        i.toString(),
                        `Cuota Mensual ${i}/${installments}`,
                        dueDate.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }),
                        `Gs. ${installmentAmount.toLocaleString('es-PY')}`
                    ]);
                }

                autoTable(doc, {
                    startY: currentY,
                    head: [['# Cuota', 'Descripción', 'Vencimiento', 'Monto']],
                    body: scheduleRows,
                    theme: 'plain',
                    headStyles: {
                        fillColor: [241, 245, 249],
                        textColor: [100, 116, 139],
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    bodyStyles: {
                        textColor: [51, 65, 85],
                        fontSize: 9,
                        cellPadding: 2,
                        lineColor: [226, 232, 240], // Light gray border
                        lineWidth: { bottom: 0.1 }
                    },
                    columnStyles: {
                        0: { cellWidth: 20, halign: 'center' },
                        1: { cellWidth: 'auto', textColor: [100, 116, 139] }, // Blueish description
                        2: { cellWidth: 40, halign: 'left' },
                        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
                    }
                });
            }
        }

        // --- Footer & Page Numbers ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generado por DentalApp', 14, pageHeight - 10);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }

        // Open
        window.open(doc.output('bloburl'), '_blank');
    }

    private drawSummaryCard(doc: jsPDF, x: number, y: number, w: number, h: number, title: string, value: string, subtitle: string) {
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.roundedRect(x, y, w, h, 2, 2, 'FD');

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(title, x + 4, y + 6);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(value, x + 4, y + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(subtitle, x + 4, y + 17);
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

    private async getBase64ImageFromURL(url: string): Promise<string> {
        return new Promise(async (resolve, reject) => { // added async to internal callback for cleaner await if needed, or just use fetch promise chain
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();

                reader.onloadend = () => {
                    if (reader.result) {
                        resolve(reader.result as string);
                    } else {
                        reject(new Error('Failed to convert blob to base64'));
                    }
                };

                reader.onerror = () => {
                    reject(new Error('Failed to read blob'));
                };

                reader.readAsDataURL(blob);

            } catch (e) {
                reject(e);
            }
        });
    }

    async generateCashReportPdf(data: { summary: any, movements: any[], status: any, date: Date, userName?: string, openUser?: string }, clinicInfo: any) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        // const pageHeight = doc.internal.pageSize.height; // Unused for now

        // --- Header ---
        let headerY = 20;

        // Logo
        if (clinicInfo?.logoUrl) {
            try {
                const imgData = await this.getBase64ImageFromURL(clinicInfo.logoUrl);
                if (imgData) {
                    doc.addImage(imgData, 14, 10, 30, 30, undefined, 'FAST');
                }
            } catch (e) {
                console.error('Error loading logo for PDF', e);
            }
        }

        const textX = clinicInfo?.logoUrl ? 50 : 14;

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 169, 224); // Primary Blue
        doc.text(clinicInfo?.businessName || 'DentalApp Clinic', textX, 20);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);

        headerY = 26;
        const ruc = clinicInfo?.ruc || '';
        const address = clinicInfo?.address || 'Dirección de la Clínica';
        const phone = clinicInfo?.phone || '';
        const email = clinicInfo?.email || '';

        if (ruc) {
            doc.text(`RUC: ${ruc}`, textX, headerY);
            headerY += 5;
        }

        doc.text(address, textX, headerY);
        headerY += 5;

        let contactInfo = '';
        if (phone) contactInfo += `Tel: ${phone}`;
        if (email) contactInfo += (contactInfo ? ' | ' : '') + `${email}`;

        if (contactInfo) {
            doc.text(contactInfo, textX, headerY);
        }

        // --- Title and Date ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50);
        doc.text('REPORTE DE CAJA', pageWidth - 14, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Fecha: ${new Date(data.date).toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(`Generado: ${new Date().toLocaleTimeString()}`, pageWidth - 14, 33, { align: 'right' });

        if (data.userName) {
            doc.setFontSize(8);
            doc.text(`Por: ${data.userName}`, pageWidth - 14, 38, { align: 'right' });
        }

        if (data.openUser) {
            doc.setFontSize(9);
            doc.setTextColor(50);
            doc.text(`Cajero: ${data.openUser}`, 14, 38);
        }


        // --- Summary Section ---
        let currentY = 50;

        // Draw a line separator
        doc.setDrawColor(230);
        doc.line(14, 45, pageWidth - 14, 45);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text('Resumen del Día', 14, currentY);

        const summaryData = [
            ['Saldo Inicial', Number(data.status.startBalance).toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })],
            ['Total Ingresos', Number(data.summary.income).toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })],
            ['Total Egresos', Number(data.summary.expense).toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })],
            ['Saldo Actual', Number(data.status.currentBalance).toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })]
        ];

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Concepto', 'Monto']],
            body: summaryData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            headStyles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold' },
                1: { cellWidth: 50, halign: 'right' }
            }
        });

        // --- Summary by Payment Method ---
        const lastSummaryY = (doc as any).lastAutoTable.finalY || 40;
        currentY = lastSummaryY + 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text('Resumen por Método de Pago', 14, currentY);

        // Calculate totals by method
        const methodTotals: Record<string, number> = {};
        data.movements.forEach(m => {
            const amount = Number(m.amount);
            if (m.type === 'INCOME') { // Using string literal as seen in previous logic
                methodTotals[m.paymentMethod] = (methodTotals[m.paymentMethod] || 0) + amount;
            } else if (m.type === 'EXPENSE') {
                methodTotals[m.paymentMethod] = (methodTotals[m.paymentMethod] || 0) - amount;
            }
        });

        const methodData = Object.entries(methodTotals).map(([method, total]) => [
            method,
            total.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Método', 'Total Neto']],
            body: methodData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold' },
                1: { cellWidth: 50, halign: 'right' }
            }
        });


        // --- Movements Section ---
        const lastMethodY = (doc as any).lastAutoTable.finalY;
        currentY = lastMethodY + 15;

        // Check page break
        if (currentY + 50 > doc.internal.pageSize.height) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text('Detalle de Movimientos', 14, currentY);

        const movementsData = data.movements
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(m => {
                const amount = Number(m.amount);
                return [
                    new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    m.description,
                    m.referenceId || '-',
                    m.paymentMethod,
                    // Income Column
                    (m.type === 'INCOME' || m.type === 'OPENING') ? amount.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' }) : '-',
                    // Expense Column
                    (m.type === 'EXPENSE' || m.type === 'CLOSING') ? amount.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' }) : '-'
                ];
            });

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Hora', 'Descripción', 'Ref', 'Método', 'Ingreso', 'Egreso']],
            body: movementsData,
            theme: 'striped',
            headStyles: {
                fillColor: [22, 163, 74], // Emerald color
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' }, // Slightly smaller font
            columnStyles: {
                0: { cellWidth: 15 }, // Time
                1: { cellWidth: 'auto' }, // Desc
                2: { cellWidth: 20 }, // Ref
                3: { cellWidth: 25 }, // Method
                4: { cellWidth: 25, halign: 'right', textColor: [22, 163, 74] }, // Income (Green)
                5: { cellWidth: 25, halign: 'right', textColor: [220, 38, 38] }  // Expense (Red)
            }
        });

        // --- Footer & Page Numbers ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generado por DentalApp', 14, doc.internal.pageSize.height - 10);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        // Save
        window.open(doc.output('bloburl'), '_blank');
    }

    private retrieveOriginalItem(data: any[], index: number) {
        return data[index];
    }
}

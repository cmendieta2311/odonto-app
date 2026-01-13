import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '../../modules/quotes/quotes.models';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    async generateQuotePdf(quote: Quote, clinicInfo: any, validityDays?: number) {
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
        doc.text(`Fecha: ${this.formatDate(quote.createdAt)}`, pageWidth - 14, 33, { align: 'right' });

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
            `Gs. ${this.formatCurrency(Number(item.price) || 0)}`,
            `${(item.discount || 0) > 0 ? (item.discount || 0) + '%' : '0%'}`,
            `Gs. ${this.formatCurrency(this.calculateItemTotal(item))}`
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
        const totalDiscount = quote.items.reduce((acc, item) => {
            const gross = Number(item.price) * item.quantity;
            const discountAmount = gross * ((item.discount || 0) / 100);
            return acc + discountAmount;
        }, 0);
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
        this.printSummaryLine(doc, 'Subtotal:', `Gs. ${this.formatCurrency(subtotal)}`, currentY, rightMargin);

        let totalYOffset = 8;
        if (totalDiscount > 0) {
            this.printSummaryLine(doc, 'Descuentos:', `- Gs. ${this.formatCurrency(totalDiscount)}`, currentY + 6, rightMargin);
            totalYOffset = 14;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        this.printSummaryLine(doc, 'TOTAL:', `Gs. ${this.formatCurrency(total)}`, currentY + totalYOffset, rightMargin);

        currentY += totalYOffset + 10;

        // --- Validity Note ---
        if (validityDays) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text(`* El presupuesto tiene validez por ${validityDays} días.`, 14, currentY);
            currentY += 10;
        } else {
            currentY += 5;
        }

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
                this.drawSummaryCard(doc, 14, cardY, cardWidth, cardHeight, 'CUOTA INICIAL', `Gs. ${this.formatCurrency(initialPayment)}`, 'Pagada al firmar');

                // Card 2: Total Financed
                this.drawSummaryCard(doc, 14 + cardWidth + 5, cardY, cardWidth, cardHeight, 'TOTAL A FINANCIAR', `Gs. ${this.formatCurrency(financedAmount)}`, `En ${installments} cuotas`);

                // Card 3: Due Day
                // Calculate estimated day based on today + 30 days
                const nextDueDate = new Date();
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                const dueDay = nextDueDate.getDate();
                this.drawSummaryCard(doc, 14 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, 'DÍA DE VENCIMIENTO', `Día ${dueDay}`, 'De cada mes');

                currentY += cardHeight + 10;

                // Schedule Table
                const installmentAmount = financedAmount / installments;

                let startDate = new Date();
                if (quote.firstPaymentDate) {
                    startDate = new Date(quote.firstPaymentDate);
                    // Adjust logic to ensure loop i=1 results in startDate
                    startDate.setMonth(startDate.getMonth() - 1);
                }

                const scheduleRows = [];

                for (let i = 1; i <= installments; i++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + i);
                    scheduleRows.push([
                        i.toString(),
                        `Cuota Mensual ${i}/${installments}`,
                        this.formatDate(dueDate),
                        `Gs. ${this.formatCurrency(installmentAmount)}`
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
        doc.text(`Fecha: ${this.formatDate(data.date)}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(`Generado: ${new Date().toLocaleTimeString()}`, pageWidth - 14, 33, { align: 'right' });

        if (data.status?.id) {
            doc.text(`ID Sesión: ${data.status.id.split('-')[0].toUpperCase()}`, pageWidth - 14, 38, { align: 'right' });
        }

        let extraInfoY = 38 + (data.status?.id ? 5 : 0);

        if (data.userName) {
            doc.setFontSize(8);
            doc.text(`Generado por: ${data.userName}`, pageWidth - 14, extraInfoY, { align: 'right' });
            extraInfoY += 5;
        }

        // Session Times
        if (data.status?.openingTime) {
            const openTime = new Date(data.status.openingTime).toLocaleString('es-PY');
            doc.text(`Apertura: ${openTime}`, pageWidth - 14, extraInfoY, { align: 'right' });
            extraInfoY += 5;
        }

        if (data.status?.closingTime) {
            const closeTime = new Date(data.status.closingTime).toLocaleString('es-PY');
            doc.text(`Cierre: ${closeTime}`, pageWidth - 14, extraInfoY, { align: 'right' });
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
        let totalIncome = 0;
        let totalExpense = 0;

        data.movements.forEach(m => {
            const amount = Number(m.amount);
            if (m.type === 'INCOME') {
                methodTotals[m.paymentMethod] = (methodTotals[m.paymentMethod] || 0) + amount;
            } else if (m.type === 'EXPENSE') {
                methodTotals[m.paymentMethod] = (methodTotals[m.paymentMethod] || 0) - amount;
            }

            // Calculate totals for footer
            if (m.type === 'INCOME' || m.type === 'OPENING') {
                totalIncome += amount;
            } else if (m.type === 'EXPENSE' || m.type === 'CLOSING') {
                totalExpense += amount;
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
            foot: [[
                '',
                'TOTALES',
                '',
                '',
                totalIncome.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' }),
                totalExpense.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' })
            ]],
            theme: 'striped',
            headStyles: {
                fillColor: [22, 163, 74], // Emerald color
                textColor: 255,
                fontStyle: 'bold'
            },
            footStyles: {
                fillColor: [241, 245, 249],
                textColor: [30, 41, 59],
                fontStyle: 'bold',
                halign: 'right'
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

    async generateAccountStatementPdf(patient: any, summary: any, groupedData: any[], clinicInfo: any) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let currentY = 20;

        // --- 1. HEADER (New Layout) ---
        // Logo
        if (clinicInfo?.logoUrl) {
            try {
                const imgData = await this.getBase64ImageFromURL(clinicInfo.logoUrl);
                if (imgData) {
                    doc.addImage(imgData, 14, 10, 25, 25, undefined, 'FAST');
                }
            } catch (e) { console.error('Logo error', e); }
        }

        const infoX = 45;
        let infoY = 18;

        // Clinic Name (Blue, Large)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(0, 169, 224); // Primary Blue
        doc.text((clinicInfo?.businessName || 'Dental App').toUpperCase(), infoX, infoY);

        // Clinic Details (Gray, Small)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        infoY += 6;
        if (clinicInfo?.ruc) {
            doc.text(`RUC: ${clinicInfo.ruc}`, infoX, infoY);
            infoY += 5;
        }
        if (clinicInfo?.address) {
            doc.text(clinicInfo.address, infoX, infoY);
            infoY += 5;
        }
        let contact = '';
        if (clinicInfo?.phone) contact += `Tel: ${clinicInfo.phone}`;
        if (clinicInfo?.email) contact += (contact ? ' | ' : '') + clinicInfo.email;
        if (contact) doc.text(contact, infoX, infoY);

        // Report Title (Right Aligned)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30); // Dark
        doc.text('EXTRACTO DE CUENTA', pageWidth - 14, 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha: ${this.formatDate(new Date())}`, pageWidth - 14, 24, { align: 'right' });


        // --- PATIENT INFO Section ---
        const patientY = 50;

        // Horizontal Line Separator
        doc.setDrawColor(230);
        doc.line(14, 45, pageWidth - 14, 45);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Datos del Paciente', 14, patientY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);

        doc.text(`Nombre: ${patient.firstName} ${patient.lastName}`, 14, patientY + 6);
        doc.text(`CI/RUC: ${patient.dni || 'N/A'}`, 14, patientY + 11);
        doc.text(`Teléfono: ${patient.phone || patient.phoneNumber || 'N/A'}`, 14, patientY + 16);

        // Update Start Y for Summary Cards
        currentY = patientY + 25;
        const cardWidth = (pageWidth - 28 - 10) / 3; // 3 cards, 14 margin left/right, 5 gap
        const cardHeight = 25; // Compact Height

        // Helper to draw summary card
        const drawSummaryCard = (x: number, title: string, amount: number, colorVals: [number, number, number]) => {
            // Card Border/Bg
            doc.setDrawColor(230);
            doc.setFillColor(252, 252, 253);
            doc.roundedRect(x, currentY, cardWidth, cardHeight, 3, 3, 'FD');

            // Title
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100);
            doc.text(title, x + 5, currentY + 8);

            // Amount
            // Amount
            const formattedAmount = new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
            doc.setFontSize(14); // Slightly smaller for compact
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorVals[0], colorVals[1], colorVals[2]);
            doc.text(formattedAmount, x + 5, currentY + 19);
        };

        drawSummaryCard(14, 'SALDO PENDIENTE', summary.pendingBalance, [220, 38, 38]);
        drawSummaryCard(14 + cardWidth + 5, 'TOTAL FACTURADO', summary.totalInvoiced, [30, 41, 59]);
        drawSummaryCard(14 + (cardWidth + 5) * 2, 'TOTAL PAGADO', summary.totalPaid, [22, 163, 74]);

        currentY += cardHeight + 15;

        // --- 3. CONTRACT GROUPS ---

        groupedData.forEach((group: any) => {
            // Check Page Break for Card Header
            if (currentY + 25 > doc.internal.pageSize.height - 20) {
                doc.addPage();
                currentY = 20;
            }

            // --- Group Card Header ---
            // Container styling
            doc.setDrawColor(220);
            doc.setFillColor(248, 250, 252); // Light Slate 50
            doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'F');

            // Contract / Invoice Info
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(group.title || 'N/A', 20, currentY + 9); // e.g. "Factura #F-2024-001" or "Contrato #..."

            doc.setTextColor(100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(group.treatment || 'Tratamiento General', 20, currentY + 16);

            // Right Side Totals
            const rightMargin = pageWidth - 20;
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text('MONTO TOTAL', rightMargin - 40, currentY + 8, { align: 'right' });
            doc.text('SALDO PENDIENTE', rightMargin, currentY + 8, { align: 'right' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30);
            doc.text(this.formatCurrency(group.totalAmount || 0), rightMargin - 40, currentY + 16, { align: 'right' });

            // Conditional Color for Pending
            if ((group.pendingBalance || 0) > 0) doc.setTextColor(220, 38, 38);
            else doc.setTextColor(22, 163, 74);

            doc.text(this.formatCurrency(group.pendingBalance || 0), rightMargin, currentY + 16, { align: 'right' });

            currentY += 25;

            // --- Installment Table ---
            autoTable(doc, {
                startY: currentY,
                head: [['NO. CUOTA', 'VENCIMIENTO', 'MONTO CUOTA', 'MONTO PAGADO', 'SALDO', 'ESTADO']],
                body: group.installments.map((inst: any) => [
                    inst.number,
                    this.formatDate(inst.dueDate),
                    this.formatCurrency(inst.amount || 0),
                    this.formatCurrency(inst.paid || 0),
                    this.formatCurrency(inst.balance || 0),
                    inst.status
                ]),
                theme: 'plain', // Minimalist as requested
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [100, 116, 139], // Slate 500
                    fontSize: 7,
                    fontStyle: 'bold',
                    cellPadding: 2,
                    valign: 'middle'
                },
                bodyStyles: {
                    textColor: [0, 0, 0], // Pure Black for rows
                    fontSize: 9,
                    cellPadding: 4,
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 20, fontStyle: 'bold' }, // No
                    1: { cellWidth: 30 }, // Vencimiento (Black)
                    2: { cellWidth: 30, fontStyle: 'bold' }, // Monto
                    3: { cellWidth: 30 }, // Pagado (Black)
                    4: { cellWidth: 30, fontStyle: 'bold' }, // Saldo
                    5: { cellWidth: 30, halign: 'center' } // Estado (Badge handled below)
                },
                // Draw bottom border for rows
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        data.cell.styles.lineWidth = { bottom: 0.1 };
                        data.cell.styles.lineColor = [226, 232, 240];
                    }
                },
                didDrawCell: (data) => {
                    // Badge for Status
                    if (data.section === 'body' && data.column.index === 5) {
                        const status = data.cell.raw as string;
                        let fillColor = [220, 220, 220]; // Gray default
                        let textColor = [50, 50, 50];

                        if (status === 'Pagado') {
                            fillColor = [220, 252, 231]; // Green 100
                            textColor = [22, 163, 74];   // Green 600
                        } else if (status === 'Vencido') {
                            fillColor = [254, 226, 226]; // Red 100
                            textColor = [220, 38, 38];   // Red 600
                        } else if (status === 'Pendiente') {
                            fillColor = [254, 243, 199]; // Amber 100
                            textColor = [217, 119, 6];   // Amber 600
                        }

                        // Draw Badge
                        const { x, y, width, height } = data.cell;
                        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);

                        // Centered Badge
                        const badgeWidth = 18;
                        const badgeHeight = 5;
                        const badgeX = x + (width - badgeWidth) / 2;
                        const badgeY = y + (height - badgeHeight) / 2;

                        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');

                        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                        doc.setFontSize(6);
                        doc.setFont('helvetica', 'bold');
                        doc.text(status, x + width / 2, y + height / 2 + 1, { align: 'center' });
                    }
                },
                willDrawCell: (data) => {
                    // Prevent default text drawing for Status column so we can draw badge manually
                    if (data.section === 'body' && data.column.index === 5) {
                        if (data.cell.raw) {
                            doc.setTextColor(255, 255, 255); // White text effectively hides it if bg is white
                        }
                    }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        });

        // Footer with Page Numbers
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generado por DentalApp`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        doc.save(`Extracto_Cuenta_${patient.firstName}_${patient.lastName}.pdf`);
    }

    async generateReceiptPdf(invoice: any, clinicInfo: any) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- Header ---
        if (clinicInfo?.logoUrl) {
            try {
                const imgData = await this.getBase64ImageFromURL(clinicInfo.logoUrl);
                if (imgData) doc.addImage(imgData, 14, 10, 25, 25, undefined, 'FAST');
            } catch (e) { console.error('Logo error', e); }
        }

        const infoX = 45;
        let infoY = 18;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(0, 169, 224);
        doc.text((clinicInfo?.businessName || 'Dental App').toUpperCase(), infoX, infoY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        infoY += 6;
        if (clinicInfo?.ruc) { doc.text(`RUC: ${clinicInfo.ruc}`, infoX, infoY); infoY += 5; }
        if (clinicInfo?.address) { doc.text(clinicInfo.address, infoX, infoY); infoY += 5; }
        let contact = '';
        if (clinicInfo?.phone) contact += `Tel: ${clinicInfo.phone}`;
        if (clinicInfo?.email) contact += (contact ? ' | ' : '') + clinicInfo.email;
        if (contact) doc.text(contact, infoX, infoY);

        // Title: RECIBO
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(30);
        doc.text('RECIBO DE DINERO', pageWidth - 14, 25, { align: 'right' });

        // --- Receipt Body ---
        let currentY = 50;

        // Main Box
        doc.setDrawColor(200);
        doc.setFillColor(252, 252, 253);
        doc.roundedRect(14, currentY, pageWidth - 28, 100, 3, 3, 'FD');

        const labelX = 24;
        const valueX = 70;
        let lineY = currentY + 15;
        const lineHeight = 12;

        // No. Recibo
        doc.setFontSize(12);
        doc.setTextColor(80);
        doc.text('No. Recibo:', labelX, lineY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(invoice.number || invoice.id, valueX, lineY);

        // Date
        lineY += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        doc.text('Fecha:', labelX, lineY);
        doc.setTextColor(0);
        doc.text(this.formatDate(invoice.issuedAt), valueX, lineY);

        // Amount
        lineY += lineHeight;
        doc.setTextColor(80);
        doc.text('Monto:', labelX, lineY);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(invoice.amount || 0), valueX, lineY);

        // Received From
        lineY += lineHeight;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        doc.text('Recibí de:', labelX, lineY);
        doc.setTextColor(0);
        const patientName = invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : (invoice.patientName || 'Cliente');
        const patientDni = invoice.patient?.dni ? ` - CI: ${invoice.patient.dni}` : '';
        doc.text(`${patientName}${patientDni}`, valueX, lineY);

        // Concept
        lineY += lineHeight;
        doc.setTextColor(80);
        doc.text('En concepto de:', labelX, lineY);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'italic');
        // Concept text
        let concept = 'Pago de servicios';
        if (invoice.items && invoice.items.length > 0) {
            concept = invoice.items.map((i: any) => i.description).join(', ');
        }
        // Multi-line concept if needed
        const splitConcept = doc.splitTextToSize(concept, pageWidth - valueX - 20);
        doc.text(splitConcept, valueX, lineY);

        // --- Signature ---
        const sigY = currentY + 100 + 40;
        doc.setDrawColor(100);
        doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Firma y Aclaración', pageWidth / 2, sigY + 5, { align: 'center' });
        doc.text((clinicInfo?.businessName || 'Dental App'), pageWidth / 2, sigY + 10, { align: 'center' });

        doc.save(`Recibo_${invoice.number}.pdf`);
    }

    private retrieveOriginalItem(data: any[], index: number) {
        return data[index];
    }

    private formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private formatCurrency(amount: number): string {
        return Math.round(amount).toLocaleString('es-PY');
    }
}

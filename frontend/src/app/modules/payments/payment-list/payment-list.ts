import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContractsService } from '../../contracts/contracts.service';
import { Contract, CreditStatus } from '../../contracts/contracts.models';
import { BaseListComponent } from '../../../shared/classes/base-list.component';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table';

interface ContractReceivable {
    contractId: string;
    patientName: string;
    patientId: string;
    totalAmount: number;
    contractTotal: number; // This is the original total (Monto Contrato)
    paidAmount: number;
    pendingCount: number;
    nextDueDate: string;
    status: 'OVERDUE' | 'PENDING';
    overdueCount: number;
}

@Component({
    selector: 'app-payment-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, CustomTableComponent],
    templateUrl: './payment-list.html'
})
export class PaymentListComponent extends BaseListComponent<ContractReceivable> implements OnInit {
    @Input() patientId: string | null = null;
    private contractsService = inject(ContractsService);
    private router = inject(Router);

    // Stats (calculated from current page for now, or need a separate endpoint for global stats)
    totalPending = 0;
    totalOverdue = 0;
    countPending = 0;

    columns: TableColumn[] = [
        { key: 'nextDueDate', label: 'Próximo Vencimiento' },
        { key: 'patientName', label: 'Paciente' },
        { key: 'contractId', label: 'Contrato' },
        { key: 'status', label: 'Estado' },
        { key: 'contractTotal', label: 'Monto Contrato', class: 'text-right' },
        { key: 'totalAmount', label: 'Deuda Pendiente', class: 'text-right' },
        // Actions handled by extraActions
    ];

    override ngOnInit() {
        super.ngOnInit();
    }

    loadData() {
        this.isLoading = true;
        // Fetch ACTIVE contracts to find receivables
        // Note: Ideally we want a backend endpoint specifically for 'Receivables' to filter only those with balance > 0
        // For now using getContracts with status='ACTIVE'
        this.contractsService.getContracts(this.page, this.pageSize, this.searchQuery, 'ACTIVE', '', this.patientId || '')
            .subscribe({
                next: (res) => {
                    this.processContracts(res.data);
                    this.totalItems = res.meta.total; // This is total CONTRACTS, not necessarily total receivables. 
                    // To imply total receivables properly, backend should filter by balance > 0.
                    // Assuming ACTIVE contracts imply non-zero balance usually, or we filter locally.
                    this.isLoading = false;
                },
                error: (err) => this.handleError(err)
            });
    }

    processContracts(contracts: any[]) {
        const items: ContractReceivable[] = [];
        let pagePendingSum = 0;
        let pageOverdueSum = 0;
        let pagePendingCount = 0;

        contracts.forEach(contract => {
            // Filter out if no balance? The list view implies 'Cuentas por Cobrar'. 
            // If we strictly follow pagination of Contracts, we might show contracts with 0 balance if they are ACTIVE?
            // Let's filter visually but we can't hide rows easily if totalItems is fixed by backend.
            // For now, map all ACTIVE contracts, show status.

            // Re-using logic:
            if (contract.creditSchedule) {
                const patient = contract.patient || (contract.quote ? contract.quote.patient : null);
                const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Cliente Desconocido';
                const patientId = patient ? patient.id : '';

                let contractPending = 0;
                let contractOverdue = 0;
                let pendingInstallments: any[] = [];
                let overdueCount = 0;

                contract.creditSchedule.forEach((inst: any) => {
                    if (inst.status === CreditStatus.PENDING || inst.status === CreditStatus.OVERDUE || inst.status === CreditStatus.PARTIALLY_PAID) {
                        const amount = Number(inst.amount) - (Number(inst.paidAmount) || 0);
                        contractPending += amount;
                        pendingInstallments.push(inst);

                        if (inst.status === CreditStatus.OVERDUE) {
                            contractOverdue += amount;
                            overdueCount++;
                        }
                    }
                });

                if (pendingInstallments.length > 0) {
                    pendingInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                    items.push({
                        contractId: contract.id,
                        patientName: patientName,
                        patientId: patientId,
                        totalAmount: contractPending,
                        contractTotal: contract.totalAmount || 0,
                        paidAmount: contract.totalAmount - contract.balance,
                        pendingCount: pendingInstallments.length,
                        nextDueDate: pendingInstallments[0].dueDate,
                        status: overdueCount > 0 ? 'OVERDUE' : 'PENDING',
                        overdueCount: overdueCount
                    });

                    pagePendingSum += contractPending;
                    pageOverdueSum += contractOverdue;
                    pagePendingCount += pendingInstallments.length;
                }
            }
        });

        // Sort items by status/date
        this.data = items.sort((a, b) => {
            if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
            if (a.status !== 'OVERDUE' && b.status === 'OVERDUE') return 1;
            return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        });

        // Update stats (Note: these are now Page stats, not Global. Updating labels in UI to reflect this might be needed or accepted limitation)
        this.totalPending = pagePendingSum;
        this.totalOverdue = pageOverdueSum;
        this.countPending = pagePendingCount;
    }

    payItem(item: ContractReceivable) {
        this.router.navigate(['/payments/new'], {
            queryParams: {
                patientId: item.patientId,
                contractId: item.contractId
            }
        });
    }

    // Unused methods override or remove
    override onSearch(query: string) {
        this.searchQuery = query;
        this.page = 1;
        this.loadData();
    }
}

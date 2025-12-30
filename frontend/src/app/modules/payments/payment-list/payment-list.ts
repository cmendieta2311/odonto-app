import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContractsService } from '../../contracts/contracts.service';
import { Contract, CreditStatus } from '../../contracts/contracts.models';

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
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './payment-list.html'
})
export class PaymentListComponent implements OnInit {
    private contractsService = inject(ContractsService);
    private router = inject(Router);

    receivables: ContractReceivable[] = [];
    filteredReceivables: ContractReceivable[] = [];
    isLoading = true;
    searchTerm = '';

    // Stats
    totalPending = 0;
    totalOverdue = 0;
    countPending = 0;

    ngOnInit() {
        this.loadReceivables();
    }

    loadReceivables() {
        this.isLoading = true;
        this.contractsService.getContracts().subscribe({
            next: (contracts) => {
                this.processContracts(contracts);
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    processContracts(contracts: any[]) {
        const items: ContractReceivable[] = [];
        let globalPendingSum = 0;
        let globalOverdueSum = 0;
        let globalPendingCount = 0;

        contracts.forEach(contract => {
            if (contract.status === 'ACTIVE' && contract.creditSchedule) {
                const patient = contract.patient || (contract.quote ? contract.quote.patient : null);
                const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Cliente Desconocido';
                const patientId = patient ? patient.id : '';

                let contractPending = 0;
                let contractOverdue = 0; // Amount
                let pendingInstallments: any[] = [];
                let overdueCount = 0;

                contract.creditSchedule.forEach((inst: any) => {
                    // Check relevant statuses
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
                    // Sort installments by date to find next due
                    pendingInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                    items.push({
                        contractId: contract.id,
                        patientName: patientName,
                        patientId: patientId,
                        totalAmount: contractPending,
                        contractTotal: contract.totalAmount || 0, // Populate original total
                        paidAmount: contract.totalAmount - contract.balance, // visual only
                        pendingCount: pendingInstallments.length,
                        nextDueDate: pendingInstallments[0].dueDate,
                        status: overdueCount > 0 ? 'OVERDUE' : 'PENDING',
                        overdueCount: overdueCount
                    });

                    globalPendingSum += contractPending;
                    globalOverdueSum += contractOverdue;
                    globalPendingCount += pendingInstallments.length;
                }
            }
        });

        // Sort by status (Overdue first) then by next due date
        this.receivables = items.sort((a, b) => {
            if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
            if (a.status !== 'OVERDUE' && b.status === 'OVERDUE') return 1;
            return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
        });

        this.filteredReceivables = [...this.receivables];

        this.totalPending = globalPendingSum;
        this.totalOverdue = globalOverdueSum;
        this.countPending = globalPendingCount;
    }

    filter() {
        const term = this.searchTerm.toLowerCase();
        this.filteredReceivables = this.receivables.filter(item =>
            item.patientName.toLowerCase().includes(term) ||
            item.contractId.toLowerCase().includes(term)
        );
    }

    payItem(item: ContractReceivable) {
        this.router.navigate(['/payments/new'], {
            queryParams: {
                patientId: item.patientId,
                contractId: item.contractId
            }
        });
    }
}

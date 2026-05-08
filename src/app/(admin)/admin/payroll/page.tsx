"use client";

import { PageHeader, StatCard } from "@/components/ai/ai-components";
import { WalletCards, Calendar, Activity, FileText } from "lucide-react";
import { useAdminPayrollData } from "./hooks/useAdminPayrollData";
import { PayrollFilters } from "./components/PayrollFilters";
import { PayrollTable } from "./components/PayrollTable";
import { PaymentsDialog } from "./components/PaymentsDialog";
import { PayrollSummaryItem } from "@/lib/services/admin-contracts";

export default function PaymentsPage() {
    const {
        // State
        page, setPage,
        limit, setLimit,
        search, setSearch,
        schemeFilter, setSchemeFilter,
        projectFilter, setProjectFilter,
        statusFilter, setStatusFilter,
        paymentsOpen, setPaymentsOpen,
        selectedContract, setSelectedContract,
        contractSummary, setContractSummary,
        editingPaymentId,
        paymentForm, setPaymentForm,

        // Data
        allProjects,
        isLoading,
        isLoadingPayments,
        stats,
        totalFiltered,
        totalPages,
        paginatedContracts,
        currentPayments,
        currentBreakdown,

        // Actions
        savePayment,
        deletePayment,
        isSavingPayment,
        resetPaymentForm,
        handleEditPayment
    } = useAdminPayrollData();

    const openPayments = (c: PayrollSummaryItem) => {
        setSelectedContract(c);
        setContractSummary({
            contract_target: c.calculated_target,
            total_paid: c.total_paid,
            remaining: Math.max(0, c.calculated_target - c.total_paid),
            status: c.payment_status === "paid" ? "Paid" : c.payment_status === "partially_paid" ? "PartiallyPaid" : "Pending"
        });
        setPaymentsOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Payroll Ledger" description="Authorize and record disbursements for all contract schemes" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Outstanding Bills" 
                    value={`Rp ${((stats.target - stats.released) / 1000000).toFixed(1)}M`} 
                    subtitle={`Target: Rp ${(stats.target / 1000000).toFixed(1)}M`} 
                    icon={WalletCards} 
                    glow 
                />
                <StatCard title="Pending" value={stats.pending.toString()} subtitle="Contracts" icon={Calendar} />
                <StatCard title="Partially Paid" value={stats.partiallyPaid.toString()} subtitle="Contracts" icon={Activity} />
                <StatCard title="Done" value={stats.paid.toString()} subtitle="Contracts" icon={FileText} />
            </div>

            <PayrollFilters 
                search={search}
                setSearch={setSearch}
                schemeFilter={schemeFilter}
                setSchemeFilter={setSchemeFilter}
                projectFilter={projectFilter}
                setProjectFilter={setProjectFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                limit={limit}
                setLimit={setLimit}
                allProjects={allProjects}
            />

            <PayrollTable 
                contracts={paginatedContracts}
                isLoading={isLoading}
                page={page}
                limit={limit}
                totalPages={totalPages}
                totalFiltered={totalFiltered}
                onExecute={openPayments}
                setPage={setPage}
            />

            <PaymentsDialog 
                open={paymentsOpen}
                onOpenChange={setPaymentsOpen}
                selectedContract={selectedContract}
                contractSummary={contractSummary}
                payments={currentPayments}
                monthlyBreakdown={currentBreakdown}
                isLoadingPayments={isLoadingPayments}
                isSavingPayment={isSavingPayment}
                editingPaymentId={editingPaymentId}
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                onSave={savePayment}
                onDelete={deletePayment}
                onEdit={handleEditPayment}
                resetForm={resetPaymentForm}
            />
        </div>
    );
}

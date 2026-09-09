"use client";

import { PageHeader } from "@/components/ai/ai-components";
import { Card, CardContent } from "@/components/ui/card";
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl h-[90px] flex flex-col overflow-hidden relative shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                            <WalletCards className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Outstanding Bills</p>
                            <div className="flex items-baseline gap-1.5 truncate">
                                <span className="text-xl font-black text-slate-800 tracking-tight">Rp {((stats.target - stats.released) / 1000000).toFixed(1)}M</span>
                                <span className="text-[10px] font-semibold text-slate-400">/ {(stats.target / 1000000).toFixed(1)}M</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl h-[90px] flex flex-col overflow-hidden">
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending</p>
                            <div className="flex items-baseline gap-1.5 truncate">
                                <span className="text-xl font-black text-slate-800 tracking-tight">{stats.pending}</span>
                                <span className="text-[10px] font-semibold text-slate-400">Contracts</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl h-[90px] flex flex-col overflow-hidden">
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Partially Paid</p>
                            <div className="flex items-baseline gap-1.5 truncate">
                                <span className="text-xl font-black text-slate-800 tracking-tight">{stats.partiallyPaid}</span>
                                <span className="text-[10px] font-semibold text-slate-400">Contracts</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl h-[90px] flex flex-col overflow-hidden">
                    <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Done</p>
                            <div className="flex items-baseline gap-1.5 truncate">
                                <span className="text-xl font-black text-slate-800 tracking-tight">{stats.paid}</span>
                                <span className="text-[10px] font-semibold text-slate-400">Contracts</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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

"use client";

import { PageHeader } from "@/components/ai/ai-components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCheck, AlertTriangle, Loader2 } from "lucide-react";
import { useApprovalsData } from "./hooks/useApprovalsData";
import { ApprovalsFilters } from "./components/ApprovalsFilters";
import { ApprovalsTable } from "./components/ApprovalsTable";
import { TimesheetDetailModal } from "../../../(employee)/employee/timesheet/components/TimesheetDetailModal";

const statusConfig: Record<string, { bg: string; text: string; label: string; icon?: any }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
    rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};

export default function ApprovalsPage() {
    const { state, actions } = useApprovalsData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Approvals Inbox" 
                description={`${state.totalCount} records matching filters`}
            >
                {state.selectedIds.size > 0 && (
                    <Button 
                        size="sm" 
                        className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md shadow-emerald-500/10 rounded-[6px]" 
                        onClick={actions.handleBulkApprove} 
                        disabled={state.isProcessing}
                    >
                        <CheckCheck className="h-4 w-4" /> Approve {state.selectedIds.size} Selected
                    </Button>
                )}
            </PageHeader>

            <ApprovalsFilters 
                search={state.search}
                setSearch={actions.setSearch}
                filterProject={state.filterProject}
                setFilterProject={actions.setFilterProject}
                filterStatus={state.filterStatus}
                setFilterStatus={actions.setFilterStatus}
                dateFrom={state.dateFrom}
                setDateFrom={actions.setDateFrom}
                dateTo={state.dateTo}
                setDateTo={actions.setDateTo}
                projects={state.projects}
                resetFilters={actions.resetFilters}
                limit={state.limit}
                setLimit={actions.setLimit}
                setPage={actions.setPage}
            />

            <ApprovalsTable 
                inbox={state.inbox}
                isLoading={state.isLoading}
                isProcessing={state.isProcessing}
                page={state.page}
                limit={state.limit}
                totalPages={state.totalPages}
                totalFiltered={state.totalCount}
                selectedIds={state.selectedIds}
                onApprove={actions.handleApprove}
                onReject={(l) => {
                    actions.setSelectedLog(l);
                    actions.setRejectOpen(true);
                }}
                onSelect={actions.toggleSelect}
                onSelectAll={actions.toggleSelectAll}
                onRowClick={actions.setSelectedLog}
                setPage={actions.setPage}
            />

            {/* Timesheet Detail Modal (Reused from Employee) */}
            {state.selectedLog && !state.rejectOpen && (
                <TimesheetDetailModal 
                    selectedLog={state.selectedLog}
                    onClose={() => actions.setSelectedLog(null)}
                    getTaskTitle={(tid) => state.selectedLog?.task_description || `Task #${tid}`}
                    statusConfig={statusConfig}
                    formatDateTime={(d) => d ? new Date(d).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "-"}
                    formatDuration={(m) => `${Math.floor(m / 60)}h ${m % 60}m`}
                    taskMap={{}} // Not strictly needed for basic detail
                    userMap={{}} // Not strictly needed for basic detail
                />
            )}

            {/* Reject Dialog */}
            <Dialog open={state.rejectOpen} onOpenChange={open => !state.isProcessing && actions.setRejectOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                        <DialogTitle className="text-center text-lg font-bold">Reject Timesheet</DialogTitle>
                        <DialogDescription className="text-center text-xs text-slate-500">
                            Rejecting log from <b className="text-slate-900">{state.selectedLog?.user?.full_name || `User #${state.selectedLog?.user_id}`}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Rejection Note *</label>
                            <Input 
                                value={state.rejectNote} 
                                onChange={e => actions.setRejectNote(e.target.value)} 
                                placeholder="Explain why this timesheet is being rejected..." 
                                disabled={state.isProcessing}
                                className="h-10 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => actions.setRejectOpen(false)} disabled={state.isProcessing}>Cancel</Button>
                        <Button variant="destructive" onClick={actions.handleReject} disabled={state.isProcessing} className="flex-1 font-bold">
                            {state.isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

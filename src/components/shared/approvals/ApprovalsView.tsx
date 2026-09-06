"use client";

import { PageHeader } from "@/components/ai/ai-components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApprovalsData } from "./hooks/useApprovalsData";
import { ApprovalsFilters } from "./components/ApprovalsFilters";
import { ApprovalsTable } from "./components/ApprovalsTable";
import { TimesheetDetailModal } from "@/components/shared/timesheet/components/TimesheetDetailModal";

const statusConfig: Record<string, { bg: string; text: string; label: string; icon?: any }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
    rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};

interface ApprovalsViewProps {
    rolePrefix?: string;
    title?: string;
    description?: string;
}

export function ApprovalsView({
    rolePrefix = "approvals",
    title = "Approvals Inbox",
    description,
}: ApprovalsViewProps) {
    const { state, actions } = useApprovalsData(rolePrefix);
    const anomalyCount = state.totalAnomalyCount;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title={title} 
                description={description || `${state.totalCount} records matching filters`}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-[6px] ${anomalyCount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold">{anomalyCount} Suspicious</span>
                    </div>
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
                </div>
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

            {/* Timesheet Detail Modal (Reused from Timesheet) */}
            {state.selectedLog && !state.rejectOpen && (
                <TimesheetDetailModal 
                    selectedLog={state.selectedLog}
                    onClose={() => actions.setSelectedLog(null)}
                    getTaskTitle={(tid) => state.selectedLog?.task?.title || (tid ? `Task #${tid}` : "General Productivity")}
                    statusConfig={statusConfig}
                    formatDateTime={(d) => d ? new Date(d).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "-"}
                    formatDuration={(m) => `${Math.floor(m / 60)}h ${m % 60}m`}
                    taskMap={{}}
                    userMap={{}}
                    isPMView={true}
                />
            )}

            {/* Reject Dialog */}
            <Dialog open={state.rejectOpen} onOpenChange={open => !state.isProcessing && actions.setRejectOpen(open)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                    <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-[#0f172a]">Reject Timesheet</DialogTitle>
                            <p className="text-xs text-red-600/80">
                                Rejecting log from <b className="text-slate-900">{state.selectedLog?.user?.full_name || `User #${state.selectedLog?.user_id}`}</b>
                            </p>
                        </div>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0f172a]">Rejection Note <span className="text-red-500">*</span></label>
                            <Input 
                                value={state.rejectNote} 
                                onChange={e => actions.setRejectNote(e.target.value)} 
                                placeholder="Explain why this timesheet is being rejected..." 
                                disabled={state.isProcessing}
                                className="h-10 text-sm rounded-md"
                            />
                        </div>
                    </div>
                    <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                        <Button variant="outline" className="rounded-md" onClick={() => actions.setRejectOpen(false)} disabled={state.isProcessing}>Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (!state.rejectNote?.trim()) {
                                toast.error("Please fill in all required fields (Rejection Note)");
                                return;
                            }
                            actions.handleReject();
                        }} disabled={state.isProcessing} className="rounded-md font-semibold min-w-[120px]">
                            {state.isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Reject
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Anomaly Warning Dialog */}
            <Dialog open={state.anomalyWarningOpen} onOpenChange={open => !state.isProcessing && actions.setAnomalyWarningOpen(open)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                    <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-4 pr-12 flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-amber-200 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-[#0f172a]">Anomaly Detected</DialogTitle>
                            <p className="text-xs text-amber-700/80">AI flagged suspicious timesheet</p>
                        </div>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                        One or more timesheets selected for approval have been flagged as suspicious by the AI. Are you sure you want to approve them?
                    </div>
                    <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                        <Button variant="outline" className="rounded-md" onClick={() => actions.setAnomalyWarningOpen(false)} disabled={state.isProcessing}>Cancel</Button>
                        <Button variant="destructive" onClick={actions.confirmApproval} disabled={state.isProcessing} className="rounded-md font-semibold min-w-[120px] bg-amber-600 hover:bg-amber-700 text-white">
                            {state.isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Approve Anyway
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ApprovalsView;

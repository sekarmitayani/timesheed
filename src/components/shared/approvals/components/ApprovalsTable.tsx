"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loaders/TableSkeleton";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { cn } from "@/lib/utils";

interface ApprovalsTableProps {
    inbox: TimesheetLog[];
    isLoading: boolean;
    isProcessing: boolean;
    page: number;
    limit: number;
    totalPages: number;
    totalFiltered: number;
    selectedIds: Set<number>;
    onApprove: (id: number) => void;
    onReject: (log: TimesheetLog) => void;
    onSelect: (id: number) => void;
    onSelectAll: () => void;
    onRowClick: (log: TimesheetLog) => void;
    setPage: (p: number) => void;
}

export function ApprovalsTable({
    inbox,
    isLoading,
    isProcessing,
    page,
    limit,
    totalPages,
    totalFiltered,
    selectedIds,
    onApprove,
    onReject,
    onSelect,
    onSelectAll,
    onRowClick,
    setPage
}: ApprovalsTableProps) {
    const formatTime24 = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleTimeString("en-GB", { 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: false 
        });
    };

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-x-auto flex-1 min-h-0 custom-scrollbar">
                <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-6 w-[50px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 accent-[#4B7BEC]" 
                                    checked={inbox.length > 0 && selectedIds.size === inbox.length} 
                                    onChange={onSelectAll} 
                                />
                            </TableHead>
                            <TableHead className="w-[280px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Employee</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project / ID</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Session Time</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Duration</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                            <TableHead className="w-28 pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={7} rows={6} hasAvatar={true} hasActions={true} />
                        ) : inbox.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300 opacity-60">
                                        <div className="bg-slate-50 p-4 rounded-full mb-3 border border-slate-100"><Inbox className="h-8 w-8" /></div>
                                        <p className="text-sm font-medium">All caught up! No pending timesheets.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            inbox.map((l, index) => {
                                const globalIndex = (page - 1) * limit + index + 1;
                                return (
                                    <TableRow 
                                        key={l.id} 
                                        className={cn(
                                            "hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer group",
                                            selectedIds.has(l.id) && "bg-blue-50/30"
                                        )}
                                        onClick={() => onRowClick(l)}
                                    >
                                        <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-slate-300 accent-[#4B7BEC]" 
                                                    checked={selectedIds.has(l.id)} 
                                                    onChange={() => onSelect(l.id)} 
                                                />
                                                <span className="text-[10px] font-bold text-slate-300 w-4">{globalIndex}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-3 items-center">
                                                <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                        {(l.user?.full_name || "User").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-[#4B7BEC] transition-colors">{l.user?.full_name || `User #${l.user_id}`}</span>
                                                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                                        {l.user?.email || "No email"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-slate-700">{l.title || l.project?.name || (l.project_id ? `Project #${l.project_id}` : "Daily Timesheet")}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{l.project?.name ? l.project.name : (l.project_id ? `Project #${l.project_id}` : "No Project")} • ID: {l.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600 tabular-nums">
                                                    {formatTime24(l.clock_in)} - {formatTime24(l.clock_out)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(l.clock_in).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-black text-slate-900 tabular-nums">
                                                {l.clock_out ? formatDuration(l.duration_minutes) : "LIVE"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <Badge variant="outline" className={cn(
                                                    "uppercase text-[9px] font-black px-2.5 py-0.5 tracking-wider rounded-full border-none shadow-none",
                                                    l.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                                    l.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                                    'bg-amber-50 text-amber-700'
                                                )}>
                                                    {l.status}
                                                </Badge>
                                                {l.is_anomaly && l.status === "pending" && (
                                                    <Badge variant="outline" className="uppercase text-[9px] font-black px-2 py-0.5 tracking-wider rounded-full border border-red-200 bg-red-50 text-red-700 shadow-none">
                                                        Suspicious
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                {l.status !== "approved" ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-full" 
                                                        onClick={() => onApprove(l.id)} 
                                                        disabled={isProcessing}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" 
                                                        onClick={() => onReject(l)} 
                                                        disabled={isProcessing}
                                                        title="Revoke Approval"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {l.status !== "rejected" && l.status !== "approved" && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" 
                                                        onClick={() => onReject(l)} 
                                                        disabled={isProcessing}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && totalFiltered > 0 && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/30 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{(page - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(page * limit, totalFiltered)}</span> of <span className="text-slate-900">{totalFiltered}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={page <= 1} 
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-semibold px-2 text-slate-700">
                            Page {page} of {totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

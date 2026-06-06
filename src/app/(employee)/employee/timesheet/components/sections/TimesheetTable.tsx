"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimesheetLog } from "@/lib/services/timesheet-service";

interface TimesheetTableProps {
    logs: TimesheetLog[];
    paginatedLogs: TimesheetLog[];
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    limit: number;
    statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }>;

    setCurrentPage: (val: number) => void;
    setSelectedLog: (log: TimesheetLog) => void;

    getTaskTitle: (taskId: number | null) => string;
    formatTime24: (dateStr: string | null) => string;
    formatDuration: (mins: number) => string;
}

export function TimesheetTable({
    logs,
    paginatedLogs,
    isLoading,
    currentPage,
    totalPages,
    limit,
    statusConfig,
    setCurrentPage,
    setSelectedLog,
    getTaskTitle,
    formatTime24,
    formatDuration
}: TimesheetTableProps) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                            <TableHead className="w-[50px] pl-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-center">No</TableHead>
                            <TableHead className="w-[160px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Date</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Task & Project</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Session Time</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Duration</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                            <TableHead className="w-[60px] pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                        <p>Loading timesheet logs...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : paginatedLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-slate-400 text-center">
                                    No timesheet sessions matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLogs.map((l, idx) => (
                                <TableRow
                                    key={l.id}
                                    className="hover:bg-[#f0f4fa]/50 transition-colors cursor-pointer border-b border-slate-100 last:border-0 group"
                                    onClick={() => setSelectedLog(l)}
                                >
                                    <TableCell className="pl-6 text-center text-[11px] text-slate-400 font-medium">
                                        {(currentPage - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">{new Date(l.clock_in).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                                            <span className="text-[11px] text-slate-400 uppercase font-medium tracking-tight">{new Date(l.clock_in).toLocaleDateString("en-US", { weekday: "long" })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700 truncate max-w-[250px] group-hover:text-[#2568C1] transition-colors">
                                                {getTaskTitle(l.task_id)}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium capitalize">
                                                {l.project?.name || `#${l.project_id}`}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                            <span>{formatTime24(l.clock_in)}</span>
                                            <span className="text-slate-300 font-normal">→</span>
                                            <span>{formatTime24(l.clock_out)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm">
                                        {l.clock_out ? (
                                            <span className="text-slate-700">{formatDuration(l.duration_minutes)}</span>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold animate-pulse rounded-full border-none">LIVE SESSION</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {l.status && statusConfig[l.status] && (
                                            <Badge variant="outline" className={cn(
                                                "px-2.5 py-0.5 rounded-full border-none text-[10px] font-bold uppercase tracking-wider",
                                                statusConfig[l.status].bg,
                                                statusConfig[l.status].text
                                            )}>
                                                {statusConfig[l.status].label}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex justify-end">
                                            <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white opacity-0 group-hover:opacity-100 transition-all border border-[#E2E8F0] shadow-sm">
                                                <ChevronRight className="h-3.5 w-3.5 text-[#2568C1]" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/30 px-6 py-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{(currentPage - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * limit, logs.length)}</span> of <span className="text-slate-900">{logs.length}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-slate-200"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-semibold px-2 text-slate-700">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-slate-200"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

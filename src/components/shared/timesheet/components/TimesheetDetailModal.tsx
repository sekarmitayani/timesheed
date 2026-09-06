"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiTask } from "@/lib/services/task-service";

interface TimesheetDetailModalProps {
    selectedLog: TimesheetLog | null;
    onClose: () => void;
    getTaskTitle: (taskId: number | null) => string;
    statusConfig: Record<string, { bg: string; text: string; label: string }>;
    formatDateTime: (dateStr: string | null) => string;
    formatDuration: (mins: number) => string;
    taskMap: Record<number, ApiTask>;
    userMap: Record<number, string>;
    isPMView?: boolean;
}

export function TimesheetDetailModal({
    selectedLog,
    onClose,
    getTaskTitle,
    statusConfig,
    formatDateTime,
    formatDuration,
    taskMap,
    userMap,
    isPMView
}: TimesheetDetailModalProps) {
    if (!selectedLog) return null;

    return (
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className="sm:max-w-[650px] p-0 overflow-hidden border-[#e2e8f0] rounded-md shadow-xl gap-0"
            >
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                        <p className="text-[10px] font-bold text-[#4B7BEC] uppercase tracking-widest">Timesheet Detail</p>
                        <DialogTitle className="text-base font-bold text-[#0f172a] leading-tight truncate">
                            {selectedLog.title || selectedLog.task?.title || getTaskTitle(selectedLog.task_id)}
                        </DialogTitle>
                    </div>
                    <Badge className={cn(
                        "px-2.5 py-1 rounded-md border-none text-[10px] font-bold uppercase shrink-0",
                        statusConfig[selectedLog.status]?.bg,
                        statusConfig[selectedLog.status]?.text
                    )}>
                        {statusConfig[selectedLog.status]?.label}
                    </Badge>
                </div>

                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {isPMView && selectedLog.is_anomaly && (
                        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Anomaly Detected</p>
                        </div>
                    )}
                    <div className="px-6 pt-3.5 pb-5 space-y-4">
                        {/* Info Grid */}
                        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
                            <div className="space-y-1 p-3 bg-slate-50 rounded-md border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clock In</p>
                                <p className="text-xs font-semibold text-[#0f172a]">{formatDateTime(selectedLog.clock_in)}</p>
                            </div>
                            <div className="space-y-1 p-3 bg-slate-50 rounded-md border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clock Out</p>
                                <p className="text-xs font-semibold text-[#0f172a]">{formatDateTime(selectedLog.clock_out)}</p>
                            </div>
                            <div className="space-y-1 p-3 bg-[#4B7BEC]/5 rounded-md border border-[#4B7BEC]/10">
                                <p className="text-[10px] font-bold text-[#4B7BEC] uppercase tracking-wider">Duration</p>
                                {selectedLog.clock_out ? (
                                    <p className="text-sm font-bold text-[#4B7BEC]">{formatDuration(selectedLog.duration_minutes)}</p>
                                ) : (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold animate-pulse mt-1">LIVE SESSION</Badge>
                                )}
                            </div>
                        </div>

                        {/* Meta Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 border-y border-slate-100 py-3.5">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project</p>
                                <p className="text-xs font-semibold text-[#0f172a] mt-0.5">{selectedLog.project?.name || (selectedLog.project_id ? `Project #${selectedLog.project_id}` : "None (Daily Attendance)")}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Assigner</p>
                                <p className="text-xs font-semibold text-[#0f172a] mt-0.5">
                                    {selectedLog.task_id && taskMap[selectedLog.task_id]
                                        ? (userMap[taskMap[selectedLog.task_id].created_by_id] || "Unknown") 
                                        : (selectedLog.user?.full_name || "Self")}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Created On</p>
                                <p className="text-xs font-semibold text-[#0f172a] mt-0.5">
                                    {selectedLog.task_id ? formatDateTime((taskMap[selectedLog.task_id]?.created_at) || selectedLog.task?.created_at || "") : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Complexity</p>
                                <div className="mt-1">
                                    <Badge variant="outline" className="text-[10px] font-bold border-slate-200 px-2 py-0.5 bg-slate-50 text-slate-700 rounded-sm">
                                        {selectedLog.task_id ? `Level ${(taskMap[selectedLog.task_id]?.complexity) || selectedLog.task?.complexity || "-"}` : "N/A"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Logger Note</p>
                                <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-md">
                                    <p className="text-sm text-[#0f172a] leading-relaxed italic">
                                        "{selectedLog.task_description || "No description provided."}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Rejection Section */}
                        {selectedLog.status === "rejected" && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-md space-y-2">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="h-4 w-4" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Rejection Note</p>
                                </div>
                                <p className="text-sm text-red-700 font-medium">
                                    {selectedLog.rejection_note || "Your timesheet log was rejected. Please contact your manager for more details."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}

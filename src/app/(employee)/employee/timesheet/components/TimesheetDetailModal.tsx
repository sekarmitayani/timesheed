"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, UserCircle, Calendar, FileText, AlertCircle, Activity } from "lucide-react";
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
                className="sm:max-w-[650px] p-0 overflow-hidden border-[#E2E8F0] rounded-[8px] gap-0"
            >
                <div className="bg-white border-b border-[#F1F5F9] px-6 py-5 pr-14">
                    <div className="flex justify-between items-start gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-[#4B7BEC] uppercase tracking-widest">Timesheet Detail</p>
                            <DialogTitle className="text-xl font-bold text-[#0f172a] leading-tight">
                                {selectedLog.task?.title || getTaskTitle(selectedLog.task_id)}
                            </DialogTitle>
                        </div>
                        <Badge className={cn(
                            "px-2.5 py-1 rounded-[4px] border-none text-[10px] font-bold uppercase shrink-0",
                            statusConfig[selectedLog.status]?.bg,
                            statusConfig[selectedLog.status]?.text
                        )}>
                            {statusConfig[selectedLog.status]?.label}
                        </Badge>
                    </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {isPMView && selectedLog.is_anomaly && (
                        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-0.5">Anomaly Detected</p>
                                <p className="text-sm font-medium text-rose-600 leading-relaxed">
                                    {selectedLog.anomaly_reason || "System flagged this timesheet for review due to unusual patterns."}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="p-6 space-y-6">
                        {/* Info Grid */}
                        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1 p-3 bg-slate-50 rounded-[6px] border border-slate-100">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Clock In</p>
                                <p className="text-xs font-bold text-[#0f172a]">{formatDateTime(selectedLog.clock_in)}</p>
                            </div>
                            <div className="space-y-1 p-3 bg-slate-50 rounded-[6px] border border-slate-100">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Clock Out</p>
                                <p className="text-xs font-bold text-[#0f172a]">{formatDateTime(selectedLog.clock_out)}</p>
                            </div>
                            <div className="space-y-1 p-3 bg-[#4B7BEC]/5 rounded-[6px] border border-[#4B7BEC]/10">
                                <p className="text-[10px] font-bold text-[#4B7BEC] uppercase">Duration</p>
                                {selectedLog.clock_out ? (
                                    <p className="text-sm font-bold text-[#4B7BEC]">{formatDuration(selectedLog.duration_minutes)}</p>
                                ) : (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold animate-pulse mt-1">LIVE SESSION</Badge>
                                )}
                            </div>
                        </div>

                        {/* Meta Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 border-y border-[#F1F5F9] py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <Briefcase className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Project</p>
                                    <p className="text-xs font-semibold text-[#0f172a]">{selectedLog.project?.name || `Project #${selectedLog.project_id}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <UserCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Task Assigner</p>
                                    <p className="text-xs font-semibold text-[#0f172a]">
                                        {selectedLog.task_id && taskMap[selectedLog.task_id]
                                            ? (userMap[taskMap[selectedLog.task_id].created_by_id] || "Unknown") 
                                            : (selectedLog.user?.full_name || "Self")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Task Created On</p>
                                    <p className="text-xs font-semibold text-[#0f172a]">
                                        {selectedLog.task_id ? formatDateTime((taskMap[selectedLog.task_id]?.created_at) || selectedLog.task?.created_at || "") : "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-[#4B7BEC]/5 flex items-center justify-center text-[#4B7BEC] shrink-0 border border-[#4B7BEC]/10">
                                    <Activity className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Task Complexity</p>
                                    <div className="mt-0.5">
                                        <Badge variant="outline" className="text-[10px] font-black border-[#E2E8F0] shadow-sm px-1.5 py-0 bg-white text-slate-600">
                                            {selectedLog.task_id ? `Level ${(taskMap[selectedLog.task_id]?.complexity) || selectedLog.task?.complexity || "-"}` : "N/A"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Task Logger Note</p>
                                </div>
                                <div className="p-4 bg-white border border-[#E2E8F0] rounded-[6px]">
                                    <p className="text-sm text-[#0f172a] leading-relaxed italic">
                                        "{selectedLog.task_description || "No description provided."}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Rejection Section */}
                        {selectedLog.status === "rejected" && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-[6px] space-y-2">
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

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiTask } from "@/lib/services/task-service";
import { ApiProject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentTimesheetTableProps {
    timesheets: TimesheetLog[];
    tasks: ApiTask[];
    projects: ApiProject[];
    className?: string;
}

const statusConfig: Record<string, { label: string; badge: string }> = {
    pending: { label: "Pending", badge: "bg-amber-50 text-amber-600 border-amber-200" },
    approved: { label: "Approved", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Rejected", badge: "bg-red-50 text-red-700 border-red-200" },
};

export function RecentTimesheetTable({ timesheets, tasks, projects, className }: RecentTimesheetTableProps) {
    
    const recentLogs = useMemo(() => {
        return [...timesheets]
            .filter(log => log.clock_out) // Show only completed logs
            .sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime())
            .slice(0, 6);
    }, [timesheets]);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <Card className={cn("bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow p-0 py-0 gap-0", className)}>
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Recent Completed Tasks
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Recently logged and completed work sessions
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-5">Project</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Task</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Duration</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentLogs.map((log) => {
                            const project = projects.find(p => p.id === log.project_id);
                            const task = tasks.find(t => t.id === log.task_id);
                            const status = statusConfig[log.status] || statusConfig.pending;
                            
                            return (
                                <TableRow key={log.id} className="h-12 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group transition-colors">
                                    <TableCell className="px-5 py-2">
                                        <span className="text-[11px] font-bold text-slate-400 truncate block max-w-[120px]">
                                            {project?.name || "Project"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-2">
                                        <span className="text-sm font-bold text-slate-700 truncate block max-w-[200px] group-hover:text-[#4B7BEC]">
                                            {task?.title || log.task_description || "Task"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-2">
                                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                                            {formatDuration(log.duration_minutes)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-right">
                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0.5 border-none shadow-none", status.badge)}>
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {recentLogs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-300">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No completed tasks yet</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

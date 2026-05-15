"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Plus, Pencil, Trash2, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { TaskAuditLog, ApiTask } from "@/lib/services/task-service";
import { User, ApiProject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentActivityCardProps {
    auditLogs: TaskAuditLog[];
    tasks: ApiTask[];
    projects: ApiProject[];
    currentUser: User | null;
    className?: string;
}

export function RecentActivityCard({ auditLogs, tasks, projects, currentUser, className }: RecentActivityCardProps) {
    
    const activities = useMemo(() => {
        return [...auditLogs]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6);
    }, [auditLogs]);

    const getActionConfig = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes("CREATE")) return { icon: Plus, color: "text-emerald-600", bg: "bg-emerald-50", label: "created" };
        if (a.includes("UPDATE")) return { icon: Pencil, color: "text-blue-600", bg: "bg-blue-50", label: "updated" };
        if (a.includes("DELETE")) return { icon: Trash2, color: "text-red-600", bg: "bg-red-50", label: "deleted" };
        if (a.includes("STATUS")) return { icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50", label: "changed status of" };
        if (a.includes("COMMENT")) return { icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50", label: "commented on" };
        return { icon: History, color: "text-slate-600", bg: "bg-slate-50", label: action.toLowerCase() };
    };

    return (
        <Card className={cn("bg-white border-slate-100 shadow-sm overflow-hidden", className)}>
            <CardHeader className="pb-2 border-b border-slate-50 flex flex-col items-start justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="h-4 w-4 text-emerald-500" /> Recent Activity
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 mt-0.5">Latest actions across your assigned tasks</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative px-5 py-2">
                    <div className="absolute left-[29.5px] top-2 bottom-2 w-px bg-slate-100" />
                    
                    <div className="space-y-5">
                        {activities.map((log) => {
                            const config = getActionConfig(log.action);
                            const task = tasks.find(t => t.id === log.record_id);
                            const project = task ? projects.find(p => p.id === task.project_id) : null;
                            const userName = log.user?.full_name || (String(log.user_id) === String(currentUser?.id) ? "You" : `User #${log.user_id}`);
                            
                            return (
                                <div key={log.id} className="relative flex items-start gap-3">
                                    <div className={cn("relative z-10 h-7 w-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm", config.bg, config.color)}>
                                        <config.icon className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-slate-700 leading-tight">
                                            {userName} <span className="text-slate-500 font-medium">{config.label} task</span>
                                        </p>
                                        <p className="text-[11px] font-bold text-[#4B7BEC] truncate mt-0.5">
                                            {task?.title || `Task #${log.record_id}`}
                                            {project && <span className="text-slate-400 font-medium"> in {project.name}</span>}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                            {format(new Date(log.created_at), "d MMM yyyy, HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {activities.length === 0 && (
                            <div className="py-10 text-center text-slate-300">
                                <p className="text-[10px] font-bold uppercase tracking-widest">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
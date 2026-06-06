"use client";

import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiTask } from "@/lib/services/task-service";
import { ProjectMember, User } from "@/lib/types";

interface PMTaskListViewProps {
    tasks: ApiTask[];
    members: ProjectMember[];
    onTaskClick: (t: ApiTask) => void;
    statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }>;
    currentUser: User | null;
}

export function PMTaskListView({
    tasks, members, onTaskClick, statusConfig, currentUser
}: PMTaskListViewProps) {
    const grouped = useMemo(() => {
        const g: Record<string, ApiTask[]> = { todo: [], in_progress: [], done: [] };
        tasks.forEach(t => {
            if (g[t.status]) g[t.status].push(t);
            else g.todo.push(t);
        });
        return g;
    }, [tasks]);

    const getReporterName = (task: ApiTask) => {
        const member = members.find(m => m.user_id === task.created_by_id);
        if (member?.user) return member.user.full_name;
        if (task.created_by_id === Number(currentUser?.id)) return currentUser?.full_name || "Self";
        return `User #${task.created_by_id}`;
    };

    const getAssigneeName = (task: ApiTask) => {
        const member = members.find(m => m.user_id === task.assigned_to_id);
        if (member?.user) return member.user.full_name;
        if (task.assigned_to_id === Number(currentUser?.id)) return currentUser?.full_name || "Self";
        return "Unassigned";
    };

    const getInitials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : "";

    return (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-10">
            <div className="space-y-10">
                {(["todo", "in_progress", "done"] as const).map(status => (
                    <div key={status} className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className={cn("p-1.5 rounded-md", statusConfig[status].bg)}>
                                {statusConfig[status].icon}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                {statusConfig[status].label}
                                <span className="ml-2 text-xs font-medium text-slate-400 normal-case">
                                    ({grouped[status]?.length || 0} tasks)
                                </span>
                            </h3>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-md overflow-x-auto shadow-sm custom-scrollbar">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-6 w-[25%]">Task Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[25%]">Description</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[15%]">Reporter</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[15%]">Assignee</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[10%]">Due Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {grouped[status].length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                                                No tasks in this stage
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        grouped[status].map(task => {
                                            const reporterName = getReporterName(task);
                                            const assigneeName = getAssigneeName(task);
                                            return (
                                                <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50/80 group border-b border-slate-50 last:border-0" onClick={() => onTaskClick(task)}>
                                                    <TableCell className="px-6 py-4 max-w-[200px]">
                                                        <span className="text-sm font-bold text-slate-700 group-hover:text-[#4B7BEC] transition-colors block truncate">{task.title}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4 max-w-[250px]">
                                                        <span className="text-xs font-medium text-slate-400 block truncate">{stripHtml(task.description) || "—"}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6 rounded-full">
                                                                <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                                    {getInitials(reporterName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{reporterName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6 rounded-full border border-[#4B7BEC]/10 shadow-sm">
                                                                <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                                    {getInitials(assigneeName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{assigneeName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

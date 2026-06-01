"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListTodo } from "lucide-react";
import { format } from "date-fns";
import { ApiTask } from "@/lib/services/task-service";
import { ApiProject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskOverviewCardProps {
    tasks: ApiTask[];
    projects: ApiProject[];
    className?: string;
}

const statusConfig: Record<string, { label: string; badge: string }> = {
    todo: { label: "To Do", badge: "bg-slate-100 text-slate-600 border-slate-200" },
    in_progress: { label: "In Progress", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    done: { label: "Done", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export function TaskOverviewCard({ tasks, projects, className }: TaskOverviewCardProps) {
    
    const displayTasks = useMemo(() => {
        return tasks
            .filter(t => t.status !== "done")
            .sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            })
            .slice(0, 8);
    }, [tasks]);

    return (
        <Card className={cn("bg-white overflow-hidden gap-0 py-0", className)}>
            <CardHeader className="px-6 pt-6 pb-5 border-b border-slate-50 flex flex-col items-start justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-[#4B7BEC]" /> Task Overview
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 mt-0.5">Current status of pending and upcoming tasks</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
                        <TableRow className="h-10 hover:bg-transparent border-none bg-slate-50/50">
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-5">Project Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Task Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Due Date</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayTasks.map((task) => {
                            const project = projects.find(p => p.id === task.project_id);
                            const status = statusConfig[task.status] || statusConfig.todo;
                            
                            return (
                                <TableRow key={task.id} className="h-12 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group cursor-default transition-colors">
                                    <TableCell className="px-5 py-2">
                                        <span className="text-[11px] font-bold text-slate-400 truncate block max-w-[150px]">
                                            {project?.name || "Unknown Project"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-2">
                                        <span className="text-sm font-bold text-slate-700 truncate block max-w-[250px] group-hover:text-[#4B7BEC] transition-colors">
                                            {task.title}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-2">
                                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                                            {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
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
                        {displayTasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-300">
                                    <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No active tasks found</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

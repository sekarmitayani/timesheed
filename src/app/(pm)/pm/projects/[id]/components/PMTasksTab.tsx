"use client";

import { ApiTask, ProjectMember } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTodo, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PMTasksTabProps {
    tasks: ApiTask[];
    members: ProjectMember[];
    search: string;
    setSearch: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    onCreate: () => void;
    onEdit: (t: ApiTask) => void;
    onDelete: (t: ApiTask) => void;
}

const taskStatusColors: Record<string, string> = {
    todo: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-50 text-blue-700",
    done: "bg-emerald-50 text-emerald-700",
};
const taskStatusDotColors: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-blue-500",
    done: "bg-emerald-500",
};

export function PMTasksTab({
    tasks, members, search, setSearch, filterStatus, setFilterStatus, onCreate, onEdit, onDelete
}: PMTasksTabProps) {
    const getMemberName = (userId: number) => {
        const m = members.find(m => m.user_id === userId || m.user?.id === userId);
        return m?.user?.full_name || `User #${userId}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-slate-800">Project Tasks</h2>
                    <p className="text-xs text-slate-500">Manage and track progress of project activities.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <div className="relative w-full md:w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none focus-visible:ring-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 w-[130px] text-xs bg-white border-slate-200 rounded-[6px] shadow-none">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-9 gap-2 bg-[#2568C1] hover:bg-[#1a4f99] font-bold px-4 rounded-[6px]" onClick={onCreate}>
                        <Plus className="h-4 w-4" /> Add Task
                    </Button>
                </div>
            </div>

            <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-100 h-11">
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 w-12 text-center">No</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Task Details</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Assignee</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right pr-6 w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                            <ListTodo className="h-8 w-8 text-slate-400" />
                                            <p className="text-sm font-medium text-slate-500">No tasks found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((t, index) => (
                                    <TableRow key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4 text-xs text-slate-500 font-bold text-center">{index + 1}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="font-bold text-sm text-slate-800">{t.title}</div>
                                            {t.description && <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-md">{t.description}</div>}
                                        </TableCell>
                                        <TableCell className="py-4 text-xs text-slate-600 font-bold">
                                            {getMemberName(t.assigned_to_id)}
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter", taskStatusColors[t.status])}>
                                                <div className={cn("w-1 h-1 rounded-full", taskStatusDotColors[t.status])} />
                                                <span className="uppercase">{t.status.replace("_", " ")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-[#2568C1] hover:bg-blue-50 rounded-full"
                                                    onClick={() => onEdit(t)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                    onClick={() => onDelete(t)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

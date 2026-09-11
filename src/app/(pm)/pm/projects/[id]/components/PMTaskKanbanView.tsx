"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ApiTask, taskService } from "@/lib/services/task-service";
import { ProjectMember } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Circle, PlayCircle, CheckCircle2, Calendar as CalendarIcon, MessageSquare, Pencil, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface PMTaskKanbanViewProps {
    projectId: string;
    tasks: ApiTask[];
    members: ProjectMember[];
    onTaskClick: (task: ApiTask) => void;
    onEdit: (task: ApiTask) => void;
    onDelete: (task: ApiTask) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

function resolveName(task: ApiTask, userId: number, members: ProjectMember[]) {
    return members.find(m => m.user_id === userId)?.user?.full_name || `User #${userId}`;
}

const getInitials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

export function PMTaskKanbanView({ projectId, tasks, members, onTaskClick, onEdit, onDelete }: PMTaskKanbanViewProps) {
    const queryClient = useQueryClient();

    const grouped = useMemo(() => {
        const sortDesc = (a: ApiTask, b: ApiTask) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        const g: Record<string, ApiTask[]> = { todo: [], in_progress: [], done: [] };
        tasks.forEach(t => {
            if (g[t.status]) g[t.status].push(t);
            else g.todo.push(t);
        });
        Object.values(g).forEach(arr => arr.sort(sortDesc));
        return g;
    }, [tasks]);

    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: number, status: string }) => 
            taskService.updateTaskStatus(taskId, { status: status as any }),
        onMutate: async ({ taskId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['pm', 'project', projectId, 'tasks'] });
            const previousTasks = queryClient.getQueryData(['pm', 'project', projectId, 'tasks']);
            queryClient.setQueryData(['pm', 'project', projectId, 'tasks'], (old: ApiTask[] | undefined) => {
                if (!old) return [];
                return old.map(t => t.id === taskId ? { ...t, status: status as any } : t);
            });
            return { previousTasks };
        },
        onError: (err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['pm', 'project', projectId, 'tasks'], context.previousTasks);
            }
            toast.error("Failed to update task status");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'project', projectId, 'tasks'] });
        },
        onSuccess: () => {
            toast.success("Task status updated");
        }
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId) return;
        updateStatusMutation.mutate({ taskId: Number(draggableId), status: destination.droppableId });
    };

    return (
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-2 pr-1">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 min-w-max h-full">
                    {(["todo", "in_progress", "done"] as const).map(col => {
                        const cfg = statusConfig[col];
                        const items = grouped[col] || [];
                        return (
                            <div key={col} className="flex flex-col w-[350px] bg-slate-50/80 p-3 rounded-md border border-slate-100 min-h-[440px] space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{cfg.label}</span>
                                        <span className="ml-1 text-[10px] font-bold bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full">{items.length}</span>
                                    </div>
                                </div>
                                <Droppable droppableId={col}>
                                    {(provided, snapshot) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className={cn("flex-1 space-y-2 transition-colors rounded-md", snapshot.isDraggingOver && "bg-slate-200/20")}>
                                            {items.map((task, index) => {
                                                const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
                                                const reporterName = resolveName(task, task.created_by_id, members);
                                                const assigneeName = resolveName(task, task.assigned_to_id, members);
                                                return (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                                                <Card className={cn("group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md overflow-hidden p-0 py-0 gap-0", snapshot.isDragging && "ring-2 ring-[#4B7BEC] shadow-xl rotate-1")} onClick={() => onTaskClick(task)}>
                                                                    <CardContent className="px-3 py-2.5 space-y-2">
                                                                        {/* Header: Title + Actions */}
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <h4 className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-[#4B7BEC] transition-colors line-clamp-2">{task.title}</h4>
                                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-400 hover:text-[#2568C1] hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                                                                                    <Pencil className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(task); }}>
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        {/* Reporter → Assignee */}
                                                                        <div className="flex items-center gap-1.5 text-[10px]">
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <Avatar className="h-4 w-4 rounded-full shrink-0">
                                                                                    <AvatarFallback className="text-[7px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white rounded-full">
                                                                                        {getInitials(reporterName)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-semibold text-slate-500 truncate max-w-[80px]">{reporterName}</span>
                                                                            </div>
                                                                            <ArrowRight className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <Avatar className="h-4 w-4 rounded-full shrink-0">
                                                                                    <AvatarFallback className="text-[7px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white rounded-full">
                                                                                        {getInitials(assigneeName)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-bold text-slate-700 truncate max-w-[100px]">{assigneeName}</span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Footer: Due + Badge */}
                                                                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                                            <div className="flex items-center gap-1">
                                                                                <CalendarIcon className="h-3 w-3 text-slate-400" />
                                                                                <span className="text-[10px] font-bold text-slate-500">Due: <span className="text-slate-700">{task.due_date ? format(new Date(task.due_date), "dd MMM") : "No date"}</span></span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                {daysLeft !== null && (
                                                                                    <Badge className={cn("text-[9px] font-black px-1.5 py-0 rounded-[4px] h-4 border-none", daysLeft <= 2 ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#4B7BEC]")}>
                                                                                        {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                                                                                    </Badge>
                                                                                )}
                                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-md text-slate-400 group-hover:text-[#4B7BEC] transition-all">
                                                                                    <MessageSquare className="h-3 w-3" />
                                                                                    <span className="text-[10px] font-black">{task.comment_count || 0}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}

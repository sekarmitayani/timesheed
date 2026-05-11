"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ApiTask, taskService } from "@/lib/services/task-service";
import { ProjectMember } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Circle, PlayCircle, CheckCircle2, Clock, Calendar as CalendarIcon, MessageSquare, Pencil, Trash2 } from "lucide-react";
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

export function PMTaskKanbanView({ projectId, tasks, members, onTaskClick, onEdit, onDelete }: PMTaskKanbanViewProps) {
    const queryClient = useQueryClient();

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
        return `User #${task.created_by_id}`;
    };

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
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 pr-1">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 min-w-max h-full">
                    {(["todo", "in_progress", "done"] as const).map(col => {
                        const cfg = statusConfig[col];
                        const items = grouped[col] || [];
                        return (
                            <div key={col} className="flex flex-col w-[350px] bg-slate-50/80 p-4 rounded-md border border-slate-100 min-h-[600px] space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{cfg.label}</span>
                                        <span className="ml-1 text-[10px] font-bold bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full">{items.length}</span>
                                    </div>
                                </div>
                                <Droppable droppableId={col}>
                                    {(provided, snapshot) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className={cn("flex-1 space-y-3 transition-colors rounded-md", snapshot.isDraggingOver && "bg-slate-200/20")}>
                                            {items.map((task, index) => {
                                                const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
                                                const reporterName = getReporterName(task);
                                                return (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                                                <Card className={cn("group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md overflow-hidden", snapshot.isDragging && "ring-2 ring-[#4B7BEC] shadow-xl rotate-1")} onClick={() => onTaskClick(task)}>
                                                                    <CardContent className="px-4 py-3 space-y-2">
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <h4 className="text-[14px] font-bold text-slate-800 leading-snug group-hover:text-[#4B7BEC] transition-colors line-clamp-2">{task.title}</h4>
                                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400 hover:text-[#2568C1] hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(task); }}>
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-5 w-5 rounded-md">
                                                                                <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500 rounded-md">{(reporterName || "U").substring(0, 1)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="text-[11px] font-bold text-slate-400 truncate"><span className="text-slate-600">{reporterName}</span></span>
                                                                        </div>
                                                                        <div className="pt-2.5 border-t border-slate-50 space-y-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-[11px] font-bold text-slate-500">Due: <span className="text-slate-700">{task.due_date ? format(new Date(task.due_date), "MMM d") : "No date"}</span></span></div>
                                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100/50 text-slate-400 group-hover:text-[#4B7BEC] transition-all"><MessageSquare className="h-3.5 w-3.5" /><span className="text-[11px] font-black">{task.comment_count || 0}</span></div>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-300" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Created: <span className="font-medium text-slate-400 italic">{format(new Date(task.created_at), "MMM d, HH:mm")}</span></span></div>
                                                                                {daysLeft !== null && <Badge className={cn("text-[10px] font-black px-2 py-0.5 rounded-md h-5", daysLeft <= 2 ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#4B7BEC]")}>{daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Today" : `${daysLeft}d left`}</Badge>}
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

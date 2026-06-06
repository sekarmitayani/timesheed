"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ApiTask, taskService } from "@/lib/services/task-service";
import { ProjectMember, User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Circle, PlayCircle, CheckCircle2, Clock, Calendar as CalendarIcon, MessageSquare, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface KanbanViewProps {
    projectId: string;
    tasks: ApiTask[];
    members: ProjectMember[];
    onTaskClick: (task: ApiTask) => void;
    currentUser: User | null;
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

export function KanbanView({ projectId, tasks, members, onTaskClick, currentUser }: KanbanViewProps) {
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
            await queryClient.cancelQueries({ queryKey: ['employee', 'project', projectId, 'tasks'] });
            const previousTasks = queryClient.getQueryData(['employee', 'project', projectId, 'tasks']);
            queryClient.setQueryData(['employee', 'project', projectId, 'tasks'], (old: ApiTask[] | undefined) => {
                if (!old) return [];
                return old.map(t => t.id === taskId ? { ...t, status: status as any } : t);
            });
            return { previousTasks };
        },
        onError: (err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['employee', 'project', projectId, 'tasks'], context.previousTasks);
            }
            toast.error("Failed to update task status");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'project', projectId, 'tasks'] });
        },
        onSuccess: () => {
            toast.success("Task status updated");
        }
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId) return;
        
        const task = tasks.find(t => String(t.id) === draggableId);
        const isAssignedToMe = task && currentUser && String(task.assigned_to_id) === String(currentUser.id);
        
        if (!isAssignedToMe) {
            toast.error("You can only move tasks assigned to you");
            return;
        }

        updateStatusMutation.mutate({ taskId: Number(draggableId), status: destination.droppableId });
    };

    return (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(["todo", "in_progress", "done"] as const).map(col => {
                        const cfg = statusConfig[col];
                        const items = grouped[col] || [];
                        return (
                            <div key={col} className="flex flex-col space-y-3 bg-slate-50/80 p-4 rounded-md border border-slate-100 min-h-[600px]">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{cfg.label}</span>
                                        <span className="ml-1 text-[10px] font-bold bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full">{items.length}</span>
                                    </div>
                                </div>
                                <Droppable droppableId={col}>
                                    {(provided, snapshot) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className={cn("flex-1 space-y-2.5 transition-colors rounded-md", snapshot.isDraggingOver && "bg-slate-200/20")}>
                                            {items.map((task, index) => {
                                                const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
                                                const reporterName = resolveName(task, task.created_by_id, members);
                                                const assigneeName = resolveName(task, task.assigned_to_id, members);
                                                const isAssignedToMe = currentUser && String(task.assigned_to_id) === String(currentUser.id);

                                                return (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={!isAssignedToMe}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                                                <Card 
                                                                    className={cn(
                                                                        "group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all rounded-md overflow-hidden", 
                                                                        snapshot.isDragging && "ring-2 ring-[#2568C1] shadow-xl rotate-1", 
                                                                        !isAssignedToMe ? "opacity-75 grayscale-[0.3] cursor-not-allowed" : "cursor-pointer"
                                                                    )} 
                                                                    onClick={() => onTaskClick(task)}
                                                                >
                                                                    <CardContent className="px-4 py-2.5 space-y-1.5 relative">
                                                                        {!isAssignedToMe && (
                                                                            <div className="absolute top-2 right-2">
                                                                                <Lock className="h-3 w-3 text-slate-300" />
                                                                            </div>
                                                                        )}
                                                                        {/* Title */}
                                                                        <h4 className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-[#2568C1] transition-colors line-clamp-2 pr-4">{task.title}</h4>
                                                                        {/* Reporter → Assignee */}
                                                                        <div className="flex items-center gap-1.5 text-[10px]">
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <Avatar className="h-4 w-4 rounded-[4px] shrink-0">
                                                                                    <AvatarFallback className="text-[7px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white rounded-[4px]">
                                                                                        {getInitials(reporterName)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-semibold text-slate-500 truncate max-w-[80px]">{reporterName}</span>
                                                                            </div>
                                                                            <ArrowRight className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <Avatar className="h-4 w-4 rounded-[4px] shrink-0">
                                                                                    <AvatarFallback className="text-[7px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white rounded-[4px]">
                                                                                        {getInitials(assigneeName)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className={cn("truncate max-w-[100px]", isAssignedToMe ? "font-black text-[#2568C1]" : "font-bold text-slate-700")}>{assigneeName}</span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Footer: Due + Created + Badge */}
                                                                        <div className="pt-1.5 border-t border-slate-50 space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    <CalendarIcon className="h-3 w-3 text-slate-400" />
                                                                                    <span className="text-[10px] font-bold text-slate-500">Due: <span className="text-slate-700">{task.due_date ? format(new Date(task.due_date), "MMM d") : "No date"}</span></span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-md text-slate-400 group-hover:text-[#2568C1] transition-all">
                                                                                    <MessageSquare className="h-3 w-3" />
                                                                                    <span className="text-[10px] font-black">{task.comment_count || 0}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3 text-slate-300" />
                                                                                    <span className="text-[10px] font-medium text-slate-400">Created at {format(new Date(task.created_at), "MMM d, HH:mm")}</span>
                                                                                </div>
                                                                                {daysLeft !== null && (
                                                                                    <Badge className={cn("text-[9px] font-black px-1.5 py-0 rounded-[4px] h-4 border-none", daysLeft <= 2 ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#2568C1]")}>
                                                                                        {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                                                                                    </Badge>
                                                                                )}
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

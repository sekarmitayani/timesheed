"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ApiTask, taskService } from "@/lib/services/task-service";
import { ProjectMember } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Circle, PlayCircle, CheckCircle2, Clock, Calendar as CalendarIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KanbanViewProps {
    tasks: ApiTask[];
    members: ProjectMember[];
    setTasks: React.Dispatch<React.SetStateAction<ApiTask[]>>;
    onTaskClick: (task: ApiTask) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function KanbanView({ tasks, members, setTasks, onTaskClick }: KanbanViewProps) {
    const grouped = useMemo(() => {
        const g: Record<string, ApiTask[]> = { todo: [], in_progress: [], done: [] };
        tasks.forEach(t => {
            if (g[t.status]) g[t.status].push(t);
            else g.todo.push(t); // fallback
        });
        return g;
    }, [tasks]);

    const getReporterName = (task: ApiTask) => {
        const member = members.find(m => m.user_id === task.created_by_id);
        if (member?.user) return member.user.full_name;
        return `User #${task.created_by_id}`;
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const taskId = Number(draggableId);
        const newStatus = destination.droppableId as "todo" | "in_progress" | "done";
        
        // Optimistic UI update
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await taskService.updateTaskStatus(taskId, { status: newStatus });
            toast.success("Task status updated");
        } catch (e: any) {
            toast.error("Failed to update task status");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar h-[calc(100vh-200px)]">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(["todo", "in_progress", "done"] as const).map(col => {
                        const cfg = statusConfig[col];
                        const items = grouped[col];
                        return (
                            <div key={col} className="flex flex-col space-y-4 bg-slate-50/80 p-4 rounded-md border border-slate-100 min-h-[600px]">
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
                                                                        <h4 className="text-[14px] font-bold text-slate-800 leading-snug group-hover:text-[#4B7BEC] transition-colors line-clamp-2">{task.title}</h4>
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-5 w-5 rounded-md">
                                                                                <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500 rounded-md">{reporterName.charAt(0)}</AvatarFallback>
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

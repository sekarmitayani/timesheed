import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, MessageSquare, ArrowRight, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiTask } from "@/lib/services/task-service";
import { ProjectMember } from "@/lib/types";

interface TaskKanbanViewProps {
    grouped: Record<string, ApiTask[]>;
    onDragEnd: (result: DropResult) => void;
    handleTaskClick: (task: ApiTask) => void;
    getProjectName: (pid: number) => string;
    allMembers: Record<number, ProjectMember[]>;
    currentUserId: number | undefined;
    currentUserFullName: string | undefined;
    statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }>;
}

function resolveName(task: ApiTask, userId: number, allMembers: Record<number, ProjectMember[]>, currentUserId?: number, currentUserFullName?: string) {
    return allMembers[task.project_id]?.find(m => m.user_id === userId)?.user?.full_name
        || (userId === currentUserId ? currentUserFullName : undefined)
        || `User #${userId}`;
}

export function TaskKanbanView({
    grouped, onDragEnd, handleTaskClick, getProjectName,
    allMembers, currentUserId, currentUserFullName, statusConfig
}: TaskKanbanViewProps) {
    return (
        <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
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
                                                const reporterName = resolveName(task, task.created_by_id, allMembers, currentUserId, currentUserFullName);
                                                const assigneeName = resolveName(task, task.assigned_to_id, allMembers, currentUserId, currentUserFullName);
                                                return (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                                                <Card className={cn("group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md overflow-hidden", snapshot.isDragging && "ring-2 ring-[#4B7BEC] shadow-xl rotate-1")} onClick={() => handleTaskClick(task)}>
                                                                    <CardContent className="px-4 py-2.5 space-y-1.5">
                                                                        {/* Header: Project + Comments */}
                                                                        <div className="flex items-center justify-between">
                                                                            <Badge className="bg-[#4B7BEC]/5 text-[#4B7BEC] border-none text-[9px] font-bold px-2 py-0 h-5 rounded-md uppercase tracking-tighter">{getProjectName(task.project_id)}</Badge>
                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-md text-slate-400 group-hover:text-[#4B7BEC] transition-all">
                                                                                <MessageSquare className="h-3 w-3" />
                                                                                <span className="text-[10px] font-black">{task.comment_count || 0}</span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Title */}
                                                                        <h4 className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-[#4B7BEC] transition-colors line-clamp-2">{task.title}</h4>
                                                                        {/* Reporter → Assignee */}
                                                                        <div className="flex items-center gap-1.5 text-[10px]">
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <Avatar className="h-4 w-4 rounded-[4px] shrink-0">
                                                                                    <AvatarFallback className="text-[7px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white rounded-[4px]">
                                                                                        {reporterName.charAt(0)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-semibold text-slate-500 truncate max-w-[80px]">{reporterName}</span>
                                                                            </div>
                                                                            <ArrowRight className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <Avatar className="h-4 w-4 rounded-[4px] shrink-0">
                                                                                    <AvatarFallback className="text-[7px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white rounded-[4px]">
                                                                                        {assigneeName.charAt(0)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-bold text-slate-700 truncate max-w-[100px]">{assigneeName}</span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Footer: Due + Created + Badge */}
                                                                        <div className="pt-1.5 border-t border-slate-50 space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    <CalendarIcon className="h-3 w-3 text-slate-400" />
                                                                                    <span className="text-[10px] font-bold text-slate-500">Due: <span className="text-slate-700">{task.due_date ? format(new Date(task.due_date), "MMM d") : "No date"}</span></span>
                                                                                </div>
                                                                                {daysLeft !== null && (
                                                                                    <Badge className={cn("text-[9px] font-black px-1.5 py-0 rounded-[4px] h-4 border-none", daysLeft <= 2 ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#4B7BEC]")}>
                                                                                        {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="h-3 w-3 text-slate-300" />
                                                                                <span className="text-[10px] font-medium text-slate-400">Created at {format(new Date(task.created_at), "MMM d, HH:mm")}</span>
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

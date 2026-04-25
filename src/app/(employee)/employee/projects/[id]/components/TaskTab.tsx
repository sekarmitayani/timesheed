"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
    differenceInDays, addWeeks, subWeeks, addDays, subDays, 
    getHours, getMinutes, isToday 
} from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ApiTask, taskService, TaskComment, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    Circle, PlayCircle, CheckCircle2, Clock, List, 
    LayoutGrid, Calendar as CalendarIcon, MessageSquare, 
    ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TaskDetailDialog } from "../../../tasks/components/TaskDetailDialog";

interface TaskTabProps {
    project: ApiProject;
    tasks: ApiTask[];
    members: ProjectMember[];
    setTasks: React.Dispatch<React.SetStateAction<ApiTask[]>>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-600 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PROJECT_COLORS = [
    { bg: "bg-blue-50", text: "text-blue-700", borderL: "border-l-blue-400", dot: "bg-blue-400" },
    { bg: "bg-violet-50", text: "text-violet-700", borderL: "border-l-violet-400", dot: "bg-violet-400" },
    { bg: "bg-emerald-50", text: "text-emerald-700", borderL: "border-l-emerald-400", dot: "bg-emerald-400" },
];

export function TaskTab({ project, tasks, members, setTasks }: TaskTabProps) {
    const currentUser = useAuthStore((s) => s.user);
    
    const [view, setView] = useState("kanban");
    const [calView, setCalView] = useState<"day" | "week" | "month">("month");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const calendarScrollRef = useRef<HTMLDivElement>(null);

    // Dialog state
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [taskLogs, setTaskLogs] = useState<TimesheetLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(false);

    const selectedReporter = useMemo(() => {
        if (!selectedTask) return null;
        const member = members.find(m => m.user_id === selectedTask.created_by_id);
        if (member?.user) return member.user as unknown as User;
        if (selectedTask.created_by_id === Number(currentUser?.id)) return currentUser;
        return null;
    }, [selectedTask, members, currentUser]);

    // Group tasks
    const grouped = useMemo(() => {
        const g: Record<string, ApiTask[]> = { todo: [], in_progress: [], done: [] };
        tasks.forEach(t => {
            if (g[t.status]) g[t.status].push(t);
            else g.todo.push(t); // fallback
        });
        return g;
    }, [tasks]);

    const getProjectName = () => project.name;
    const getProjectColor = () => PROJECT_COLORS[0];

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

    const handleTaskClick = async (task: ApiTask) => {
        setSelectedTask(task);
        setDialogOpen(true);
        
        setIsLoadingLogs(true);
        setIsLoadingActivities(true);
        try {
            const [logsRes, commentsRes, auditRes] = await Promise.all([
                timesheetService.getTaskTimesheets(task.id).catch(() => []),
                taskService.getTaskComments(task.id).catch(() => []),
                taskService.getTaskLogs(task.id).catch(() => [])
            ]);
            setTaskLogs(Array.isArray(logsRes) ? logsRes : []);
            setComments(Array.isArray(commentsRes) ? commentsRes : []);
            setAuditLogs(Array.isArray(auditRes) ? auditRes : []);
        } catch (error) {
            console.error("Failed to load task details", error);
        } finally {
            setIsLoadingLogs(false);
            setIsLoadingActivities(false);
        }
    };

    const handleSendComment = async () => {
        if (!selectedTask || !commentText.trim()) return;
        setIsSendingComment(true);
        try {
            const newComment = await taskService.addTaskComment(selectedTask.id, commentText);
            setComments([newComment, ...comments]);
            setCommentText("");
        } catch (e: any) {
            toast.error("Failed to send comment");
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleClockIn = async () => {
        if (!selectedTask) return;
        setIsClockingIn(true);
        try {
            await timesheetService.clockIn({ project_id: selectedTask.project_id, task_id: selectedTask.id });
            toast.success("Clocked in successfully");
            setDialogOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to clock in");
        } finally {
            setIsClockingIn(false);
        }
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
            toast.success(`Task status updated`);
        } catch (e: any) {
            toast.error("Failed to update task status");
            // Revert on failure (in a real app you'd fetch tasks again or revert state)
        }
    };

    // Calendar logic
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
    }, [currentMonth]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentMonth);
        return eachDayOfInterval({ start, end: endOfWeek(start) });
    }, [currentMonth]);

    const getTasksForDay = (day: Date) => tasks.filter(t => isSameDay(day, t.due_date ? new Date(t.due_date) : new Date(t.created_at)));

    const navigateCalendar = (dir: "prev" | "next") => {
        if (calView === "month") setCurrentMonth(dir === "next" ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
        else if (calView === "week") setCurrentMonth(dir === "next" ? addWeeks(currentMonth, 1) : subWeeks(currentMonth, 1));
        else setCurrentMonth(dir === "next" ? addDays(currentMonth, 1) : subDays(currentMonth, 1));
    };

    const getTaskStyle = (task: ApiTask, dayTasks: ApiTask[]) => {
        const date = new Date(task.created_at);
        const h = getHours(date);
        const m = getMinutes(date);
        const top = (h * 60 + m) * (64 / 60);
        const sameHourTasks = dayTasks.filter(t => getHours(new Date(t.created_at)) === h);
        const overlapIndex = sameHourTasks.findIndex(t => t.id === task.id);
        const overlapCount = sameHourTasks.length;
        if (overlapCount > 1) {
            const widthPercent = 100 / overlapCount;
            return { top: `${top}px`, width: `calc(${widthPercent}% - 4px)`, left: `calc(${overlapIndex * widthPercent}% + 2px)`, right: 'auto' };
        }
        return { top: `${top}px` };
    };

    return (
        <div className="flex flex-col w-full gap-4">
            <div className="flex justify-end mb-2">
                <Tabs value={view} onValueChange={setView} className="w-full md:w-auto">
                    <TabsList className="bg-white border border-slate-200 p-1 h-9 rounded-lg shadow-sm">
                        <TabsTrigger value="kanban" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold"><LayoutGrid className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
                        <TabsTrigger value="list" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold"><List className="h-3.5 w-3.5" /> List</TabsTrigger>
                        <TabsTrigger value="calendar" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold"><CalendarIcon className="h-3.5 w-3.5" /> Calendar</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {view === "kanban" && (
                <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
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
                                                                        <Card className={cn("group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md overflow-hidden", snapshot.isDragging && "ring-2 ring-[#4B7BEC] shadow-xl rotate-1")} onClick={() => handleTaskClick(task)}>
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
            )}

            {view === "list" && (
                <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
                    <div className="space-y-10">
                        {(["todo", "in_progress", "done"] as const).map(status => (
                            <div key={status} className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className={cn("p-1.5 rounded-md", statusConfig[status].bg)}>{statusConfig[status].icon}</div>
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{statusConfig[status].label}<span className="ml-2 text-xs font-medium text-slate-400 normal-case">({grouped[status].length} tasks)</span></h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-md overflow-hidden shadow-sm">
                                    <Table>
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
                                                <TableRow><TableCell colSpan={5} className="h-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No tasks in this stage</TableCell></TableRow>
                                            ) : (
                                                grouped[status].map(task => {
                                                    const reporterName = getReporterName(task);
                                                    const assigneeName = getAssigneeName(task);
                                                    return (
                                                        <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50/80 group border-b border-slate-50 last:border-0" onClick={() => handleTaskClick(task)}>
                                                            <TableCell className="px-6 py-4"><span className="text-sm font-bold text-slate-700 group-hover:text-[#4B7BEC] line-clamp-1">{task.title}</span></TableCell>
                                                            <TableCell className="px-4 py-4"><span className="text-xs font-medium text-slate-400 line-clamp-1">{task.description || "—"}</span></TableCell>
                                                            <TableCell className="px-4 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6 rounded-full"><AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">{reporterName.charAt(0)}</AvatarFallback></Avatar>
                                                                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{reporterName}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-4 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6 rounded-full border border-[#4B7BEC]/10"><AvatarFallback className="text-[8px] font-bold bg-blue-50 text-[#4B7BEC]">{assigneeName.charAt(0)}</AvatarFallback></Avatar>
                                                                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{assigneeName}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-4 py-4"><span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}</span></TableCell>
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
            )}

            {view === "calendar" && (
                <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col shadow-sm flex-1 min-h-0 h-[600px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{calView === "day" ? format(currentMonth, "EEEE, MMMM d, yyyy") : calView === "week" ? `${format(startOfWeek(currentMonth), "MMM d")} – ${format(endOfWeek(currentMonth), "MMM d, yyyy")}` : format(currentMonth, "MMMM yyyy")}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md" onClick={() => navigateCalendar("prev")}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 px-4 text-[10px] font-bold uppercase text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md tracking-widest" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md" onClick={() => navigateCalendar("next")}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-0.5 rounded-md flex shrink-0">
                                {(["day", "week", "month"] as const).map(v => <Button key={v} variant="ghost" size="sm" className={cn("h-7 px-4 text-[10px] font-bold uppercase transition-all rounded-md tracking-widest", calView === v ? "bg-white text-[#4B7BEC] shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600 border border-transparent")} onClick={() => setCalView(v)}>{v}</Button>)}
                            </div>
                        </div>
                    </div>
                    <div ref={calendarScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0 custom-scrollbar">
                        {calView === "month" && (
                            <div className="flex flex-col">
                                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>)}</div>
                                <div className="grid grid-cols-7 divide-x divide-slate-100 border-l border-slate-100">
                                    {calendarDays.map((day, idx) => {
                                        const dayTasks = getTasksForDay(day);
                                        return (
                                            <div key={idx} className={cn("min-h-[130px] p-1.5 bg-white transition-colors cursor-pointer border-b border-slate-100", !isSameMonth(day, currentMonth) ? "bg-slate-50/40" : "hover:bg-blue-50/20")} onClick={() => {}}>
                                                <div className="flex items-center justify-center mb-1"><span className={cn("text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" : isSameMonth(day, currentMonth) ? "text-slate-700" : "text-slate-300")}>{format(day, "d")}</span></div>
                                                <div className="space-y-0.5">
                                                    {dayTasks.slice(0, 3).map(task => { 
                                                        const pColor = getProjectColor(); 
                                                        return (
                                                            <div key={task.id} onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }} className={cn("flex items-center gap-1 px-1.5 py-1 rounded-[4px] text-[9px] font-bold truncate transition-all hover:shadow-sm", pColor.bg, pColor.text)}>
                                                                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", pColor.dot)} /><span>{task.title}</span>
                                                            </div>
                                                        ); 
                                                    })}
                                                    {dayTasks.length > 3 && <p className="text-[9px] font-bold text-[#4B7BEC] pl-1 mt-0.5 hover:underline cursor-pointer">+{dayTasks.length - 3} more</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {(calView === "day" || calView === "week") && (() => {
                            const viewDays = calView === "week" ? weekDays : [currentMonth];
                            const HOUR_HEIGHT = 64;
                            const HEADER_HEIGHT = calView === "week" ? 52 : 0;
                            const EXTRA_PADDING = 20;
                            return (
                                <div className="flex" style={{ height: `${HOURS.length * HOUR_HEIGHT + HEADER_HEIGHT + EXTRA_PADDING}px` }}>
                                    <div className="w-[60px] flex-none border-r border-slate-200 bg-slate-50/30 sticky left-0 z-20">
                                        <div style={{ height: `${HEADER_HEIGHT}px` }} className={cn("border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm", calView === "week" && "sticky top-0 z-40")} />
                                        <div style={{ height: `${EXTRA_PADDING}px` }} />
                                        {HOURS.map(h => (
                                            <div key={h} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                                                <span className="text-[10px] font-bold text-slate-400 absolute -top-[7px] right-2 left-1 text-right">{format(new Date(new Date().setHours(h, 0, 0, 0)), "HH:mm")}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 flex divide-x divide-slate-100">
                                        {viewDays.map((day, dIdx) => {
                                            const dayTasks = getTasksForDay(day);
                                            return (
                                                <div key={dIdx} className="flex-1 relative border-r border-slate-100 min-w-[120px]">
                                                    {calView === "week" && (
                                                        <div className="h-[52px] border-b border-slate-200 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{format(day, "EEE")}</span>
                                                            <span className={cn("text-xs font-black mt-0.5", isToday(day) ? "text-[#4B7BEC]" : "text-slate-700")}>{format(day, "d")}</span>
                                                        </div>
                                                    )}
                                                    <div className="relative w-full" style={{ height: `${HOURS.length * HOUR_HEIGHT}px`, marginTop: `${EXTRA_PADDING}px` }}>
                                                        {HOURS.map(h => <div key={h} className="absolute w-full border-t border-slate-50" style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} />)}
                                                        {dayTasks.map(task => {
                                                            const pColor = getProjectColor();
                                                            const style = getTaskStyle(task, dayTasks);
                                                            return (
                                                                <div key={task.id} className="absolute left-1 right-1 p-0.5 transition-all hover:z-20 cursor-pointer" style={style} onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}>
                                                                    <div className={cn("w-full h-full rounded-md border border-opacity-50 p-1.5 overflow-hidden flex flex-col gap-0.5 shadow-sm hover:shadow-md transition-shadow", pColor.bg, pColor.borderL, pColor.text)}>
                                                                        <span className="text-[9px] font-bold leading-tight line-clamp-2">{task.title}</span>
                                                                        <span className="text-[8px] font-medium opacity-70 truncate">{format(new Date(task.created_at), "HH:mm")}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            <TaskDetailDialog
                isOpen={dialogOpen}
                onClose={setDialogOpen}
                selectedTask={selectedTask}
                taskLogs={taskLogs}
                isLoadingLogs={isLoadingLogs}
                canManageTask={false}
                onEdit={() => {}}
                onDelete={() => {}}
                statusConfig={statusConfig}
                comments={comments}
                auditLogs={auditLogs}
                reporter={selectedReporter}
                commentText={commentText}
                setCommentText={setCommentText}
                onSendComment={handleSendComment}
                isSendingComment={isSendingComment}
                isLoadingActivities={isLoadingActivities}
                onClockIn={handleClockIn}
                isClockingIn={isClockingIn}
                getProjectName={getProjectName}
                currentUser={currentUser}
                formatDateTime={(dateStr) => dateStr ? format(new Date(dateStr), "dd MMM yyyy, HH:mm") : "-"}
            />
        </div>
    );
}

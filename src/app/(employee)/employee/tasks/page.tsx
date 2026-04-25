"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { 
    Plus, Loader2, CheckCircle2, Circle, PlayCircle, 
    ListTodo, LayoutGrid, List, Calendar as CalendarIcon, Clock, 
    ChevronLeft, ChevronRight, CalendarDays, Layers, MessageSquare, 
    X as XIcon, Avatar as AvatarIcon
} from "lucide-react";
import { toast } from "sonner";
import { taskService, ApiTask, CreateTaskPayload, TaskComment, TaskAuditLog } from "@/lib/services/task-service";
import { projectService } from "@/lib/services/project-service";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, differenceInDays, addWeeks, subWeeks, addDays, subDays, getHours, getMinutes, isToday } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Dynamic Imports for Modals
const TaskDetailDialog = dynamic(() => import("./components/TaskDetailDialog").then(mod => mod.TaskDetailDialog), { loading: () => null });
const TaskFormDialog = dynamic(() => import("./components/TaskFormDialog").then(mod => mod.TaskFormDialog), { loading: () => null });
const DayTasksDialog = dynamic(() => import("./components/DayTasksDialog").then(mod => mod.DayTasksDialog), { loading: () => null });
const DeleteConfirmDialog = dynamic(() => import("./components/DeleteConfirmDialog").then(mod => mod.DeleteConfirmDialog), { loading: () => null });

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
    { bg: "bg-amber-50", text: "text-amber-700", borderL: "border-l-amber-400", dot: "bg-amber-400" },
    { bg: "bg-rose-50", text: "text-rose-700", borderL: "border-l-rose-400", dot: "bg-rose-400" },
    { bg: "bg-cyan-50", text: "text-cyan-700", borderL: "border-l-cyan-400", dot: "bg-cyan-400" },
    { bg: "bg-orange-50", text: "text-orange-700", borderL: "border-l-orange-400", dot: "bg-orange-400" },
    { bg: "bg-indigo-50", text: "text-indigo-700", borderL: "border-l-indigo-400", dot: "bg-indigo-400" },
];

export default function TasksPage() {
    const currentUser = useAuthStore(s => s.user);
    const isEmployee = currentUser?.role === "employee";

    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [view, setView] = useState<string>("kanban");
    const [calView, setCalView] = useState<"day" | "week" | "month">("month");

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [allMembers, setAllMembers] = useState<Record<number, ProjectMember[]>>({});

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<CreateTaskPayload & { status?: string }>({
        project_id: 0, assigned_to_id: 0, title: "", description: "", status: "todo", due_date: ""
    });

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [taskLogs, setTaskLogs] = useState<TimesheetLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(false);

    const [comments, setComments] = useState<TaskComment[]>([]);
    const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);
    const [reporter, setReporter] = useState<User | null>(null);
    const [commentText, setCommentText] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    const [dayTasksOpen, setDayTasksOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<ApiTask | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const calendarScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if ((calView === "day" || calView === "week") && view === "calendar" && calendarScrollRef.current) {
            const scroll = () => {
                const now = new Date();
                const HOUR_HEIGHT = 64;
                const HEADER_HEIGHT = calView === "week" ? 52 : 0;
                const EXTRA_PADDING = 20;
                const topOffset = HEADER_HEIGHT + EXTRA_PADDING;
                const scrollTarget = topOffset + (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60) - 150;
                calendarScrollRef.current?.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
            };
            scroll();
            setTimeout(scroll, 50);
            setTimeout(scroll, 300);
        }
    }, [calView, view]);

    const canManageTask = useMemo(() => {
        if (!selectedTask || !currentUser) return false;
        if (currentUser.role === "admin" || currentUser.role === "projectmanager") return true;
        return selectedTask.created_by_id === Number(currentUser.id);
    }, [selectedTask, currentUser]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await projectService.getProjects(1, 100);
                setProjects(res.data || []);
            } catch (e: any) {
                toast.error("Failed to load projects");
            } finally {
                setIsLoadingProjects(false);
            }
        };
        load();
    }, []);

    const fetchTasks = useCallback(async () => {
        setIsLoadingTasks(true);
        try {
            let res: ApiTask[] = [];
            if (selectedProjectId === "all") {
                const allPromises = projects.map(p => taskService.getProjectTasks(String(p.id)));
                const results = await Promise.all(allPromises);
                res = results.flat();
            } else {
                res = await taskService.getProjectTasks(selectedProjectId);
            }
            const taskList = Array.isArray(res) ? res : [];
            setTasks(taskList);

            const uniquePids = Array.from(new Set(taskList.map(t => t.project_id)));
            const membersMap: Record<number, ProjectMember[]> = {};
            await Promise.all(uniquePids.map(async (pid) => {
                try {
                    const m = await projectService.getProjectMembers(String(pid));
                    membersMap[pid] = Array.isArray(m) ? m : [];
                } catch {
                    membersMap[pid] = [];
                }
            }));
            setAllMembers(membersMap);
        } catch (e: any) {
            toast.error("Failed to load tasks");
        } finally {
            setIsLoadingTasks(false);
        }
    }, [selectedProjectId, projects]);

    useEffect(() => {
        fetchTasks();
        const loadMembers = async () => {
            if (!selectedProjectId || selectedProjectId === "all") return;
            try {
                const res = await projectService.getProjectMembers(selectedProjectId);
                setMembers(Array.isArray(res) ? res : []);
            } catch { /* skip */ }
        };
        if (!isEmployee && selectedProjectId !== "all") loadMembers();
    }, [selectedProjectId, fetchTasks, isEmployee]);

    useEffect(() => {
        const loadFormMembers = async () => {
            if (!form.project_id) return;
            try {
                const res = await projectService.getProjectMembers(String(form.project_id));
                setMembers(Array.isArray(res) ? res : []);
            } catch { /* skip */ }
        };
        if (!isEmployee && dialogOpen) loadFormMembers();
    }, [form.project_id, isEmployee, dialogOpen]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const taskId = Number(draggableId);
        const newStatus = destination.droppableId as "todo" | "in_progress" | "done";
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await taskService.updateTaskStatus(taskId, { status: newStatus });
            toast.success(`Task status updated`);
        } catch (e: any) {
            toast.error("Failed to update task status");
            fetchTasks();
        }
    };

    const openCreate = () => {
        setEditingTask(null);
        setForm({ 
            project_id: selectedProjectId === "all" ? 0 : Number(selectedProjectId), 
            assigned_to_id: 0, title: "", description: "", status: "todo", due_date: ""
        });
        setDialogOpen(true);
    };

    const openEdit = (task: ApiTask) => {
        setEditingTask(task);
        const formattedDate = task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "";
        setForm({ 
            project_id: task.project_id, 
            assigned_to_id: task.assigned_to_id, 
            title: task.title, 
            description: task.description || "", 
            status: task.status,
            due_date: formattedDate
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.project_id) { toast.error("Project is required"); return; }
        if (!form.title) { toast.error("Title is required"); return; }
        setIsSaving(true);
        try {
            if (editingTask) {
                await taskService.updateTask(editingTask.id, { 
                    title: form.title, 
                    description: form.description || "", 
                    status: form.status as any,
                    due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined
                });
                toast.success(`Task updated`);
            } else {
                const payload: CreateTaskPayload = { 
                    project_id: Number(form.project_id), 
                    title: form.title, 
                    description: form.description || undefined,
                    due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined
                };
                if (!isEmployee && form.assigned_to_id) payload.assigned_to_id = Number(form.assigned_to_id);
                await taskService.createTask(payload);
                toast.success(`Task created`);
            }
            setDialogOpen(false);
            fetchTasks();
        } catch (e: any) {
            toast.error("Failed to save task");
        } finally {
            setIsSaving(false);
        }
    };

    const openDelete = (task: ApiTask) => {
        setTaskToDelete(task);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);
        try {
            await taskService.deleteTask(taskToDelete.id);
            toast.success(`Task deleted`);
            setDeleteOpen(false);
            fetchTasks();
        } catch (e: any) {
            toast.error("Failed to delete task");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTaskClick = async (task: ApiTask) => {
        setSelectedTask(task);
        setDetailOpen(true);
        setIsLoadingLogs(true);
        setIsLoadingActivities(true);
        setReporter(null);

        try {
            const projectMembers = await projectService.getProjectMembers(String(task.project_id));
            const memberList = Array.isArray(projectMembers) ? projectMembers : [];
            const [logs, comms, auds] = await Promise.all([
                timesheetService.getTaskTimesheets(task.id).catch(() => []),
                taskService.getTaskComments(task.id).catch(() => []),
                taskService.getTaskLogs(task.id).catch(() => [])
            ]);

            const foundReporter = memberList.find(m => m.user_id === task.created_by_id);
            if (foundReporter && foundReporter.user) {
                setReporter({ ...foundReporter.user, id: String(foundReporter.user.id) } as User);
            } else if (task.created_by_id === Number(currentUser?.id)) {
                setReporter(currentUser as User);
            }

            const resolvedAuds = auds.map((log: TaskAuditLog) => {
                const actor = memberList.find(m => m.user_id === log.user_id);
                return {
                    ...log,
                    user: actor?.user || (log.user_id === Number(currentUser?.id) ? { full_name: currentUser?.full_name || "Unknown" } : log.user)
                };
            });

            setTaskLogs(Array.isArray(logs) ? logs : []);
            setComments(Array.isArray(comms) ? comms : []);
            setAuditLogs(resolvedAuds);
        } catch (error) {
            console.error("Error loading task details:", error);
        } finally {
            setIsLoadingLogs(false);
            setIsLoadingActivities(false);
        }
    };

    const handleSendComment = async () => {
        if (!selectedTask || !commentText.trim()) return;
        setIsSendingComment(true);
        try {
            await taskService.addTaskComment(selectedTask.id, commentText);
            const comms = await taskService.getTaskComments(selectedTask.id);
            setComments(Array.isArray(comms) ? comms : []);
            setCommentText("");
            toast.success("Comment added");
        } catch {
            toast.error("Failed to add comment");
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleClockIn = async () => {
        if (!selectedTask) return;
        setIsClockingIn(true);
        try {
            if (selectedTask.status !== "in_progress") {
                await taskService.updateTaskStatus(selectedTask.id, { status: "in_progress" });
            }
            await timesheetService.clockIn({ project_id: selectedTask.project_id, task_id: selectedTask.id });
            toast.success(`Clocked in & Task moved to In Progress`);
            setDetailOpen(false);
            fetchTasks();
        } catch (e: any) {
            toast.error("Failed to clock in");
        } finally {
            setIsClockingIn(false);
        }
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setDayTasksOpen(true);
    };

    const grouped = useMemo(() => ({
        todo: tasks.filter(t => t.status === "todo"),
        in_progress: tasks.filter(t => t.status === "in_progress"),
        done: tasks.filter(t => t.status === "done"),
    }), [tasks]);

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
    const getProjectName = (pid: number) => projects.find(p => p.id === pid)?.name || "Unknown Project";
    const getProjectColor = (projectId: number) => {
        const idx = projects.findIndex(p => p.id === projectId);
        return PROJECT_COLORS[(idx === -1 ? 0 : idx) % PROJECT_COLORS.length];
    };

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

    const formatDateTime = (dateStr: string | null) => dateStr ? format(new Date(dateStr), "dd MMM yyyy, HH:mm") : "-";
    const formatDuration = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

    return (
        <div className="flex flex-col w-full gap-4 h-[calc(100dvh-115px)] lg:h-[calc(100dvh-120px)] overflow-hidden">
            <PageHeader title="My Tasks" description="Manage your assigned objectives">
                <Button size="sm" className="gap-2 bg-[#4B7BEC] hover:bg-[#3b60c0] font-bold h-9 rounded-lg" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> New Task
                </Button>
            </PageHeader>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-full md:max-w-[260px]">
                        {isLoadingProjects ? <div className="h-9 bg-white animate-pulse border rounded-lg w-full" /> : (
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="border-slate-200 focus:ring-[#4B7BEC] bg-white h-9 shadow-sm rounded-lg text-sm">
                                    <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-[#4B7BEC]" /><SelectValue placeholder="All Projects" /></div>
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="all" className="text-sm font-semibold text-[#4B7BEC]">All Projects</SelectItem>
                                    {projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
                <Tabs value={view} onValueChange={setView} className="w-full md:w-auto">
                    <TabsList className="bg-white border border-slate-200 p-1 h-9 rounded-lg shadow-sm">
                        <TabsTrigger value="kanban" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold"><LayoutGrid className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
                        <TabsTrigger value="list" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold"><List className="h-3.5 w-3.5" /> List</TabsTrigger>
                        <TabsTrigger value="calendar" className="data-[state=active]:bg-[#4B7BEC] data-[state=active]:text-white gap-2 rounded-md px-4 transition-all h-7 text-xs font-bold"><CalendarIcon className="h-3.5 w-3.5" /> Calendar</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {isLoadingTasks ? <div className="py-24 flex flex-col items-center"><Loader2 className="h-10 w-10 animate-spin text-[#4B7BEC] opacity-30" /></div> : (
                <div className="flex-1 min-h-0 flex flex-col">
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
                                                                const reporterName = allMembers[task.project_id]?.find(m => m.user_id === task.created_by_id)?.user?.full_name || (task.created_by_id === Number(currentUser?.id) ? currentUser?.full_name : undefined) || `User #${task.created_by_id}`;
                                                                return (
                                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                                        {(provided, snapshot) => (
                                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                                                                                <Card className={cn("group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md overflow-hidden", snapshot.isDragging && "ring-2 ring-[#4B7BEC] shadow-xl rotate-1")} onClick={() => handleTaskClick(task)}>
                                                                                    <CardContent className="px-4 py-3 space-y-2">
                                                                                        <Badge className="bg-[#4B7BEC]/5 text-[#4B7BEC] border-none text-[9px] font-bold px-2 py-0 h-5 rounded-md uppercase tracking-tighter">{getProjectName(task.project_id)}</Badge>
                                                                                        <h4 className="text-[14px] font-bold text-slate-800 leading-snug group-hover:text-[#4B7BEC] transition-colors line-clamp-2">{task.title}</h4>
                                                                                        <div className="flex items-center gap-2"><Avatar className="h-5 w-5 rounded-md"><AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500 rounded-md">{reporterName.charAt(0)}</AvatarFallback></Avatar><span className="text-[11px] font-bold text-slate-400 truncate"><span className="text-slate-600">{reporterName}</span></span></div>
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
                                        <div className="flex items-center gap-3 px-1"><div className={cn("p-1.5 rounded-md", statusConfig[status].bg)}>{statusConfig[status].icon}</div><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{statusConfig[status].label}<span className="ml-2 text-xs font-medium text-slate-400 normal-case">({grouped[status].length} tasks)</span></h3></div>
                                        <div className="bg-white border border-slate-100 rounded-md overflow-hidden shadow-sm">
                                            <Table>
                                                <TableHeader className="bg-slate-50/50">
                                                    <TableRow className="h-10 hover:bg-transparent border-b border-slate-100">
                                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-6 w-[25%]">Task Name</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[25%]">Description</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[15%]">Reporter</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[15%]">Assignee</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 w-[10%]">Due Date</TableHead>
                                                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-6 w-[10%] text-right">Project</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {grouped[status].length === 0 ? <TableRow><TableCell colSpan={6} className="h-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No tasks in this stage</TableCell></TableRow> : grouped[status].map(task => {
                                                        const pMembers = allMembers[task.project_id] || [];
                                                        const reporterName = pMembers.find(m => m.user_id === task.created_by_id)?.user?.full_name || (task.created_by_id === Number(currentUser?.id) ? currentUser?.full_name : undefined) || "System";
                                                        const assigneeName = pMembers.find(m => m.user_id === task.assigned_to_id)?.user?.full_name || (task.assigned_to_id === Number(currentUser?.id) ? currentUser?.full_name : undefined) || "Unassigned";
                                                        return (
                                                            <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50/80 group border-b border-slate-50 last:border-0" onClick={() => handleTaskClick(task)}>
                                                                <TableCell className="px-6 py-4"><span className="text-sm font-bold text-slate-700 group-hover:text-[#4B7BEC] line-clamp-1">{task.title}</span></TableCell>
                                                                <TableCell className="px-4 py-4"><span className="text-xs font-medium text-slate-400 line-clamp-1">{task.description || "—"}</span></TableCell>
                                                                <TableCell className="px-4 py-4"><div className="flex items-center gap-2"><Avatar className="h-6 w-6 rounded-full"><AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500">{reporterName.charAt(0)}</AvatarFallback></Avatar><span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{reporterName}</span></div></TableCell>
                                                                <TableCell className="px-4 py-4"><div className="flex items-center gap-2"><Avatar className="h-6 w-6 rounded-full border border-[#4B7BEC]/10"><AvatarFallback className="text-[8px] font-bold bg-blue-50 text-[#4B7BEC]">{assigneeName.charAt(0)}</AvatarFallback></Avatar><span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">{assigneeName}</span></div></TableCell>
                                                                <TableCell className="px-4 py-4"><span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}</span></TableCell>
                                                                <TableCell className="px-6 py-4 text-right"><Badge className="bg-[#4B7BEC]/5 text-[#4B7BEC] border-none text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter whitespace-nowrap">{getProjectName(task.project_id)}</Badge></TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {view === "calendar" && (
                        <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col shadow-sm flex-1 min-h-0">
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
                                                    <div key={idx} className={cn("min-h-[130px] p-1.5 bg-white transition-colors cursor-pointer border-b border-slate-100", !isSameMonth(day, currentMonth) ? "bg-slate-50/40" : "hover:bg-blue-50/20")} onClick={() => handleDayClick(day)}>
                                                        <div className="flex items-center justify-center mb-1"><span className={cn("text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" : isSameMonth(day, currentMonth) ? "text-slate-700" : "text-slate-300")}>{format(day, "d")}</span></div>
                                                        <div className="space-y-0.5">{dayTasks.slice(0, 3).map(task => { const pColor = getProjectColor(task.project_id); return <div key={task.id} onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }} className={cn("flex items-center gap-1 px-1.5 py-1 rounded-[4px] text-[9px] font-bold truncate transition-all hover:shadow-sm", pColor.bg, pColor.text)}><span className={cn("h-1.5 w-1.5 rounded-full shrink-0", pColor.dot)} /><span>{task.title}</span></div>; })}{dayTasks.length > 3 && <p className="text-[9px] font-bold text-[#4B7BEC] pl-1 mt-0.5 hover:underline cursor-pointer">+{dayTasks.length - 3} more</p>}</div>
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
                                            <div className="w-[60px] flex-none border-r border-slate-200 bg-slate-50/30 sticky left-0 z-20"><div style={{ height: `${HEADER_HEIGHT}px` }} className={cn("border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm", calView === "week" && "sticky top-0 z-40")} /><div style={{ height: `${EXTRA_PADDING}px` }} />{HOURS.map(h => <div key={h} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}><span className="text-[10px] font-bold text-slate-400 absolute -top-[7px] right-2 left-1 text-right">{format(new Date(new Date().setHours(h, 0, 0, 0)), "HH:mm")}</span></div>)}</div>
                                            <div className="flex-1 flex divide-x divide-slate-100">
                                                {viewDays.map((day, dIdx) => {
                                                    const dayTasks = getTasksForDay(day);
                                                    return (
                                                        <div key={dIdx} className="flex-1 relative min-w-0">
                                                            {calView === "week" && <div className="flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-200" style={{ height: `${HEADER_HEIGHT}px` }}><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(day, "EEE")}</span><span className={cn("text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" : "text-slate-700")}>{format(day, "d")}</span></div>}
                                                            <div style={{ height: `${EXTRA_PADDING}px` }} />
                                                            {HOURS.map(h => <div key={h} className="border-b border-slate-50" style={{ height: `${HOUR_HEIGHT}px` }}><div className="h-1/2 border-b border-slate-50/50" /></div>)}
                                                            {dayTasks.map(task => {
                                                                const pColor = getProjectColor(task.project_id);
                                                                const style = getTaskStyle(task, dayTasks);
                                                                return <div key={task.id} onClick={() => handleTaskClick(task)} className={cn("absolute p-2 rounded-[4px] border-l-[3px] shadow-sm cursor-pointer z-10 transition-all hover:z-20 hover:shadow-md group/task overflow-hidden", pColor.bg, pColor.text, pColor.borderL)} style={{ top: `calc(${style.top} + ${HEADER_HEIGHT + EXTRA_PADDING}px)`, minHeight: "44px", ...(style.width ? { width: style.width, left: style.left, right: style.right } : { left: '2px', right: '2px' }) }}><div className="flex flex-col gap-0.5 overflow-hidden"><span className="text-[10px] font-bold leading-tight truncate group-hover/task:text-[#4B7BEC]">{task.title}</span><span className="text-[8px] font-bold opacity-60 truncate">{format(new Date(task.created_at), "HH:mm")} · {getProjectName(task.project_id)}</span></div></div>;
                                                            })}
                                                            {isToday(day) && <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${(getHours(currentTime) * 60 + getMinutes(currentTime)) * (HOUR_HEIGHT / 60) + HEADER_HEIGHT + EXTRA_PADDING}px` }}><div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-[5px] ring-2 ring-red-500/20" /><div className="flex-1 h-[2px] bg-red-500" /></div>}
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
                </div>
            )}

            {/* Modals with Dynamic Imports */}
            {detailOpen && (
                <TaskDetailDialog 
                    isOpen={detailOpen}
                    onClose={setDetailOpen}
                    selectedTask={selectedTask}
                    taskLogs={taskLogs}
                    isLoadingLogs={isLoadingLogs}
                    canManageTask={canManageTask}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    statusConfig={statusConfig}
                    comments={comments}
                    auditLogs={auditLogs}
                    reporter={reporter}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    onSendComment={handleSendComment}
                    isSendingComment={isSendingComment}
                    isLoadingActivities={isLoadingActivities}
                    onClockIn={handleClockIn}
                    isClockingIn={isClockingIn}
                    getProjectName={getProjectName}
                    currentUser={currentUser}
                    formatDateTime={formatDateTime}
                />
            )}

            {dialogOpen && (
                <TaskFormDialog 
                    isOpen={dialogOpen}
                    onClose={setDialogOpen}
                    editingTask={editingTask}
                    isSaving={isSaving}
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    projects={projects}
                    members={members}
                    isEmployee={isEmployee}
                />
            )}

            {dayTasksOpen && (
                <DayTasksDialog 
                    isOpen={dayTasksOpen}
                    onClose={setDayTasksOpen}
                    selectedDate={selectedDate}
                    dayTasks={selectedDate ? getTasksForDay(selectedDate) : []}
                    onTaskClick={handleTaskClick}
                    getProjectName={getProjectName}
                    statusConfig={statusConfig}
                />
            )}

            {deleteOpen && (
                <DeleteConfirmDialog 
                    isOpen={deleteOpen}
                    onClose={() => setDeleteOpen(false)}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                    taskTitle={taskToDelete?.title || ""}
                />
            )}
        </div>
    );
}

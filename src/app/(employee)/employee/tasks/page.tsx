"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { 
    Plus, Loader2, ArrowRight, CheckCircle2, Circle, PlayCircle, 
    ListTodo, Pencil, Trash2, AlertTriangle, MoreVertical, 
    LayoutGrid, List, Calendar as CalendarIcon, Clock, 
    ChevronLeft, ChevronRight, CalendarDays, Layers, Briefcase, User2,
    MessageSquare, History as HistoryIcon, Send, X as XIcon
} from "lucide-react";
import { toast } from "sonner";
import { taskService, ApiTask, CreateTaskPayload, UpdateTaskPayload, TaskComment, TaskAuditLog } from "@/lib/services/task-service";
import { projectService } from "@/lib/services/project-service";
import { adminUserService } from "@/lib/services/admin-users";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, differenceInDays, addWeeks, subWeeks, addDays, subDays, getHours, getMinutes, isToday } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

    // Auto-scroll to current time in Day/Week view
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
            
            // Try immediately, then a few more times to ensure layout is ready
            scroll();
            setTimeout(scroll, 50);
            setTimeout(scroll, 300);
        }
    }, [calView, view]);

    const canManageTask = useMemo(() => {
        if (!selectedTask || !currentUser) return false;
        // Admin and PM can always manage
        if (currentUser.role === "admin" || currentUser.role === "projectmanager") return true;
        // Creator can manage
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

            // Fetch members for each project to resolve names
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

    const handleStatusChange = async (task: ApiTask, newStatus: "todo" | "in_progress" | "done") => {
        try {
            await taskService.updateTaskStatus(task.id, { status: newStatus });
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
            fetchTasks();
        } catch (e: any) {
            toast.error("Failed to update status");
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
            fetchTasks(); // Revert on error
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

    const openEdit = (task: ApiTask, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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

    const openDelete = (task: ApiTask, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentMonth);
        const end = endOfWeek(start);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getTasksForDay = (day: Date) => tasks.filter(t => {
        const taskDate = t.due_date ? new Date(t.due_date) : new Date(t.created_at);
        return isSameDay(day, taskDate);
    });
    const getProjectName = (pid: number) => projects.find(p => p.id === pid)?.name || "Unknown Project";
    const getProjectColor = (projectId: number) => {
        const idx = projects.findIndex(p => p.id === projectId);
        return PROJECT_COLORS[(idx === -1 ? 0 : idx) % PROJECT_COLORS.length];
    };

    const navigateCalendar = (dir: "prev" | "next") => {
        if (calView === "month") {
            setCurrentMonth(dir === "next" ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
        } else if (calView === "week") {
            setCurrentMonth(dir === "next" ? addWeeks(currentMonth, 1) : subWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(dir === "next" ? addDays(currentMonth, 1) : subDays(currentMonth, 1));
        }
    };

    const getTaskStyle = (task: ApiTask, dayTasks: ApiTask[]) => {
        const date = new Date(task.created_at);
        const h = getHours(date);
        const m = getMinutes(date);
        const top = (h * 60 + m) * (64 / 60);
        // Find overlapping tasks at the same hour
        const sameHourTasks = dayTasks.filter(t => {
            const tDate = new Date(t.created_at);
            return getHours(tDate) === h;
        });
        const overlapIndex = sameHourTasks.findIndex(t => t.id === task.id);
        const overlapCount = sameHourTasks.length;
        if (overlapCount > 1) {
            const widthPercent = 100 / overlapCount;
            const leftPercent = overlapIndex * widthPercent;
            return { top: `${top}px`, width: `calc(${widthPercent}% - 4px)`, left: `calc(${leftPercent}% + 2px)`, right: 'auto' };
        }
        return { top: `${top}px` };
    };

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
                        {isLoadingProjects ? (
                            <div className="h-9 bg-white animate-pulse border rounded-lg w-full" />
                        ) : (
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

            {isLoadingTasks ? (
                <div className="py-24 flex flex-col items-center"><Loader2 className="h-10 w-10 animate-spin text-[#4B7BEC] opacity-30" /></div>
            ) : (
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
                                                        <div 
                                                            {...provided.droppableProps} 
                                                            ref={provided.innerRef} 
                                                            className={`flex-1 space-y-3 transition-colors rounded-md ${snapshot.isDraggingOver ? "bg-slate-200/20" : ""}`}
                                                        >
                                                            {items.map((task, index) => {
                                                                const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
                                                                const isUrgent = daysLeft !== null && daysLeft <= 2;
                                                                const projectMembers = allMembers[task.project_id] || [];
                                                                const reporterUser = projectMembers.find(m => m.user_id === task.created_by_id)?.user;
                                                                const reporterName = reporterUser?.full_name || (task.created_by_id === Number(currentUser?.id) ? currentUser?.full_name : undefined) || `User #${task.created_by_id}`;

                                                                return (
                                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                style={provided.draggableProps.style}
                                                                            >
                                                                                <Card 
                                                                                    className={`group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md overflow-hidden py-0 gap-0 ${snapshot.isDragging ? "ring-2 ring-[#4B7BEC] shadow-xl rotate-1" : ""}`} 
                                                                                    onClick={() => handleTaskClick(task)}
                                                                                >
                                                                                    <CardContent className="p-5 space-y-2.5 px-5">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <Badge className="bg-[#4B7BEC]/5 text-[#4B7BEC] border-none text-[9px] font-bold px-2 py-0 h-5 rounded-md uppercase tracking-tighter">
                                                                                                {getProjectName(task.project_id)}
                                                                                            </Badge>
                                                                                        </div>
                                                                                        <h4 className="text-[14px] font-bold text-slate-800 leading-snug group-hover:text-[#4B7BEC] transition-colors line-clamp-2">
                                                                                            {task.title}
                                                                                        </h4>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Avatar className="h-5 w-5 rounded-md">
                                                                                                <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-500 rounded-md">
                                                                                                    {reporterName.charAt(0)}
                                                                                                </AvatarFallback>
                                                                                            </Avatar>
                                                                                            <span className="text-[11px] font-bold text-slate-400 truncate">
                                                                                                <span className="text-slate-600">{reporterName}</span>
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="pt-3 border-t border-slate-50 space-y-2.5">
                                                                                            <div className="flex items-center justify-between">
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                                                                                    <span className="text-[11px] font-bold text-slate-500">
                                                                                                        Due: <span className="text-slate-700">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No date"}</span>
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100/50 text-slate-400 group-hover:text-[#4B7BEC] transition-all">
                                                                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                                                                    <span className="text-[11px] font-black">{task.comment_count || 0}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex items-center justify-between">
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                                                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                                                                                        Created: <span className="font-medium text-slate-400 italic">{format(new Date(task.created_at), "MMM d, HH:mm")}</span>
                                                                                                    </span>
                                                                                                </div>
                                                                                                {daysLeft !== null && (
                                                                                                    <Badge className={cn(
                                                                                                        "text-[10px] font-black px-2 py-0.5 rounded-md h-5",
                                                                                                        isUrgent ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#4B7BEC]"
                                                                                                    )}>
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
                    )}

                    {view === "list" && (
                        <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar">
                            <div className="space-y-10">
                                {(["todo", "in_progress", "done"] as const).map(status => {
                                    const groupTasks = grouped[status];
                                    const cfg = statusConfig[status];
                                    return (
                                        <div key={status} className="space-y-4">
                                            <div className="flex items-center gap-3 px-1">
                                                <div className={cn("p-1.5 rounded-md", cfg.bg)}>{cfg.icon}</div>
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                                    {cfg.label}
                                                    <span className="ml-2 text-xs font-medium text-slate-400 normal-case">({groupTasks.length} tasks)</span>
                                                </h3>
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
                                                            <TableHead className="text-[10px] font-bold uppercase text-slate-400 px-6 w-[10%] text-right">Project</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {groupTasks.length === 0 ? (
                                                            <TableRow><TableCell colSpan={6} className="h-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No tasks in this stage</TableCell></TableRow>
                                                        ) : groupTasks.map(task => {
                                                            const pMembers = allMembers[task.project_id] || [];
                                                            const reporterUser = pMembers.find(m => m.user_id === task.created_by_id)?.user;
                                                            const reporterName = reporterUser?.full_name || (task.created_by_id === Number(currentUser?.id) ? currentUser?.full_name : undefined) || "System";
                                                            const assigneeUser = pMembers.find(m => m.user_id === task.assigned_to_id)?.user;
                                                            const assigneeName = assigneeUser?.full_name || (task.assigned_to_id === Number(currentUser?.id) ? currentUser?.full_name : undefined) || "Unassigned";
                                                            return (
                                                                <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50/80 group transition-colors border-b border-slate-50 last:border-0" onClick={() => handleTaskClick(task)}>
                                                                    <TableCell className="px-6 py-4"><span className="text-sm font-bold text-slate-700 group-hover:text-[#4B7BEC] transition-colors line-clamp-1">{task.title}</span></TableCell>
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
                                                                    <TableCell className="px-6 py-4 text-right"><Badge className="bg-[#4B7BEC]/5 text-[#4B7BEC] border-none text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter whitespace-nowrap">{getProjectName(task.project_id)}</Badge></TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {view === "calendar" && (
                        <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col shadow-sm flex-1 min-h-0">
                            {/* Calendar Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0">
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                    {calView === "day" 
                                        ? format(currentMonth, "EEEE, MMMM d, yyyy") 
                                        : calView === "week" 
                                            ? `${format(startOfWeek(currentMonth), "MMM d")} – ${format(endOfWeek(currentMonth), "MMM d, yyyy")}` 
                                            : format(currentMonth, "MMMM yyyy")
                                    }
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md" onClick={() => navigateCalendar("prev")}><ChevronLeft className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" className="h-7 px-4 text-[10px] font-bold uppercase text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md tracking-widest" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md" onClick={() => navigateCalendar("next")}><ChevronRight className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-0.5 rounded-md flex shrink-0">
                                        {(["day", "week", "month"] as const).map(v => (
                                            <Button key={v} variant="ghost" size="sm" className={cn("h-7 px-4 text-[10px] font-bold uppercase transition-all rounded-md tracking-widest", calView === v ? "bg-white text-[#4B7BEC] shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600 border border-transparent")} onClick={() => setCalView(v)}>{v}</Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Body */}
                            <div ref={calendarScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0 custom-scrollbar">
                                {/* ===== MONTH VIEW ===== */}
                                {calView === "month" && (
                                    <div className="flex flex-col">
                                        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                                <div key={day} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 divide-x divide-slate-100 border-l border-slate-100">
                                            {calendarDays.map((day, idx) => {
                                                const dayTasks = getTasksForDay(day);
                                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={cn(
                                                            "min-h-[130px] p-1.5 bg-white transition-colors cursor-pointer border-b border-slate-100",
                                                            !isCurrentMonth ? "bg-slate-50/40" : "hover:bg-blue-50/20"
                                                        )} 
                                                        onClick={() => handleDayClick(day)}
                                                    >
                                                        <div className="flex items-center justify-center mb-1">
                                                            <span className={cn(
                                                                "text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all",
                                                                isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" 
                                                                    : isCurrentMonth ? "text-slate-700" 
                                                                    : "text-slate-300"
                                                            )}>
                                                                {format(day, "d")}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {dayTasks.slice(0, 3).map(task => {
                                                                const pColor = getProjectColor(task.project_id);
                                                                return (
                                                                    <div 
                                                                        key={task.id} 
                                                                        onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }} 
                                                                        className={cn(
                                                                            "flex items-center gap-1 px-1.5 py-1 rounded-[4px] text-[9px] font-bold truncate cursor-pointer transition-all hover:shadow-sm",
                                                                            pColor.bg, pColor.text
                                                                        )}
                                                                    >
                                                                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", pColor.dot)} />
                                                                        <span className="truncate">{task.title}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                            {dayTasks.length > 3 && (
                                                                <p className="text-[9px] font-bold text-[#4B7BEC] pl-1 mt-0.5 hover:underline cursor-pointer">
                                                                    +{dayTasks.length - 3} more
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ===== DAY & WEEK VIEW ===== */}
                                {(calView === "day" || calView === "week") && (() => {
                                    const viewDays = calView === "week" ? weekDays : [currentMonth];
                                    const HOUR_HEIGHT = 64;
                                    const HEADER_HEIGHT = calView === "week" ? 52 : 0;
                                    const EXTRA_PADDING = 20; // Extra space so 00:00 doesn't clip
                                    return (
                                        <div className="flex" style={{ height: `${HOURS.length * HOUR_HEIGHT + HEADER_HEIGHT + EXTRA_PADDING}px` }}>
                                            {/* Time Gutter */}
                                            <div className="w-[60px] flex-none border-r border-slate-200 bg-slate-50/30 sticky left-0 z-20">
                                                {/* Corner sticky cell */}
                                                <div 
                                                    style={{ height: `${HEADER_HEIGHT}px` }} 
                                                    className={cn(
                                                        "border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm", 
                                                        calView === "week" && "sticky top-0 z-40"
                                                    )} 
                                                />
                                                <div style={{ height: `${EXTRA_PADDING}px` }} />
                                                {HOURS.map(h => (
                                                    <div key={h} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                                                        <span className="text-[10px] font-bold text-slate-400 absolute -top-[7px] right-2 left-1 text-right whitespace-nowrap">
                                                            {format(new Date(new Date().setHours(h, 0, 0, 0)), "HH:mm")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Day Columns */}
                                            <div className="flex-1 flex divide-x divide-slate-100">
                                                {viewDays.map((day, dIdx) => {
                                                    const dayTasks = getTasksForDay(day);
                                                    return (
                                                        <div key={dIdx} className="flex-1 relative min-w-0">
                                                            {/* Week Header */}
                                                            {calView === "week" && (
                                                                <div className={cn(
                                                                    "flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-200"
                                                                )} style={{ height: `${HEADER_HEIGHT}px` }}>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(day, "EEE")}</span>
                                                                    <span className={cn(
                                                                        "text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full",
                                                                        isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" : "text-slate-700"
                                                                    )}>
                                                                        {format(day, "d")}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div style={{ height: `${EXTRA_PADDING}px` }} />

                                                            {/* Hour Grid Lines */}
                                                            {HOURS.map(h => (
                                                                <div key={h} className="border-b border-slate-50" style={{ height: `${HOUR_HEIGHT}px` }}>
                                                                    <div className="h-1/2 border-b border-slate-50/50" />
                                                                </div>
                                                            ))}

                                                            {/* Task Blocks */}
                                                            {dayTasks.map(task => {
                                                                const pColor = getProjectColor(task.project_id);
                                                                const style = getTaskStyle(task, dayTasks);
                                                                const topOffset = HEADER_HEIGHT + EXTRA_PADDING;
                                                                return (
                                                                    <div 
                                                                        key={task.id} 
                                                                        onClick={() => handleTaskClick(task)} 
                                                                        className={cn(
                                                                            "absolute p-2 rounded-[4px] border-l-[3px] shadow-sm cursor-pointer z-10 transition-all hover:z-20 hover:shadow-md group/task overflow-hidden",
                                                                            pColor.bg, pColor.text, pColor.borderL
                                                                        )} 
                                                                        style={{ 
                                                                            top: `calc(${style.top} + ${topOffset}px)`,
                                                                            minHeight: "44px",
                                                                            ...(style.width ? { width: style.width, left: style.left, right: style.right } : { left: '2px', right: '2px' })
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                                                            <span className="text-[10px] font-bold leading-tight truncate group-hover/task:text-[#4B7BEC] transition-colors">{task.title}</span>
                                                                            <span className="text-[8px] font-bold opacity-60 truncate">
                                                                                {format(new Date(task.created_at), "HH:mm")} · {getProjectName(task.project_id)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Current Time Indicator */}
                                                            {isToday(day) && (
                                                                <div 
                                                                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" 
                                                                    style={{ top: `${(getHours(currentTime) * 60 + getMinutes(currentTime)) * (HOUR_HEIGHT / 60) + HEADER_HEIGHT + EXTRA_PADDING}px` }}
                                                                >
                                                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-[5px] shadow-sm ring-2 ring-red-500/20" />
                                                                    <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
                                                                </div>
                                                            )}
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

            {/* Task Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent showCloseButton={false} className="sm:max-w-[1100px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-md max-h-[90vh] flex flex-col bg-white">
                    <DialogDescription className="sr-only">Detailed information about the task, including description, timesheets, comments, and activity history.</DialogDescription>
                    {selectedTask && (
                        <>
                            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white z-30 shrink-0">
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={`${statusConfig[selectedTask.status].badge} text-[10px] font-bold px-3 py-1 rounded-md border-opacity-50`}>{statusConfig[selectedTask.status].label}</Badge>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md">
                                        <Clock className="h-3.5 w-3.5 text-[#4B7BEC]" /> <span className="text-slate-500">Logged:</span>
                                        <span className="text-[#4B7BEC]">{taskLogs.reduce((acc, curr) => acc + curr.duration_minutes, 0)}m</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canManageTask && (
                                        <>
                                            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-md text-[10px] uppercase tracking-widest transition-all" onClick={() => { setDetailOpen(false); openEdit(selectedTask); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                                            <Button variant="outline" size="sm" className="h-9 gap-2 border-red-100 bg-white text-red-500 hover:bg-red-50 font-bold rounded-md text-[10px] uppercase tracking-widest transition-all" onClick={() => { setDetailOpen(false); openDelete(selectedTask); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                                        </>
                                    )}
                                    <div className="w-px h-6 bg-slate-100 mx-1" />
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setDetailOpen(false)}><XIcon className="h-5 w-5" /></Button>
                                </div>
                            </div>
                            <div className="flex flex-1 overflow-hidden">
                                <div className="flex-[7] flex flex-col min-w-0 border-r border-slate-100 overflow-y-auto bg-white custom-scrollbar">
                                    <div className="p-8 pt-6 pb-12 space-y-8">
                                        <div className="space-y-4"><DialogTitle className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">{selectedTask.title}</DialogTitle></div>
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><ListTodo className="h-3.5 w-3.5" /> Description</h5>
                                            <div className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/30 rounded-md p-4 border border-slate-50 min-h-[100px]">{selectedTask.description || "No description provided."}</div>
                                        </div>
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <Tabs defaultValue="comments" className="w-full">
                                                <TabsList className="bg-transparent h-auto p-0 border-b border-slate-100 w-full justify-start rounded-none gap-8">
                                                    <TabsTrigger value="comments" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all"><MessageSquare className="h-3.5 w-3.5 mr-2" /> Comments</TabsTrigger>
                                                    <TabsTrigger value="timesheet" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all"><Clock className="h-3.5 w-3.5 mr-2" /> Timesheet</TabsTrigger>
                                                    <TabsTrigger value="history" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#4B7BEC] data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-[#4B7BEC] transition-all"><HistoryIcon className="h-3.5 w-3.5 mr-2" /> History</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="comments" className="pt-6 space-y-6">
                                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {isLoadingActivities ? (<div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#4B7BEC] opacity-20" /></div>) : comments.length === 0 ? (<div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No comments yet</div>) : comments.map(comm => (
                                                            <div key={comm.id} className="flex gap-3">
                                                                <Avatar size="sm" className="rounded-md border border-slate-100"><AvatarFallback className="text-[10px] font-bold rounded-md bg-blue-100 text-blue-600">{comm.user?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-800">{comm.user?.full_name}</span><span className="text-[10px] font-medium text-slate-400">{format(new Date(comm.created_at), "MMM d, HH:mm")}</span></div>
                                                                    <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 border border-slate-100 shadow-sm">{comm.comment}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="relative group">
                                                        <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="min-h-[100px] rounded-md border-slate-200 focus:ring-[#4B7BEC] focus:border-[#4B7BEC] pr-12 text-sm font-medium pt-3 resize-none shadow-sm" />
                                                        <Button size="icon" disabled={isSendingComment || !commentText.trim()} onClick={handleSendComment} className="absolute bottom-3 right-3 h-8 w-8 bg-[#4B7BEC] hover:bg-[#3b60c0] rounded-md shadow-md shadow-blue-100">{isSendingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}</Button>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="timesheet" className="pt-6">
                                                    <div className="bg-white border border-slate-100 rounded-md overflow-hidden shadow-sm">
                                                        {isLoadingLogs ? (<div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#4B7BEC] opacity-20" /></div>) : taskLogs.length === 0 ? (<div className="py-12 flex flex-col items-center justify-center text-slate-300"><Clock className="h-8 w-8 mb-2 opacity-20" /><p className="text-[10px] font-bold uppercase tracking-widest">No logs recorded yet</p></div>) : (
                                                            <Table>
                                                                <TableHeader className="bg-slate-50/50"><TableRow className="h-10 hover:bg-transparent border-b border-slate-100"><TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Date</TableHead><TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4">Time Window</TableHead><TableHead className="text-[10px] font-bold uppercase text-slate-400 px-4 text-right">Duration</TableHead></TableRow></TableHeader>
                                                                <TableBody>{taskLogs.map(log => (
                                                                    <TableRow key={log.id} className="h-12 text-[11px] border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors"><TableCell className="py-2 px-4 font-bold text-slate-700">{format(new Date(log.clock_in), "MMM d, yyyy")}</TableCell><TableCell className="py-2 px-4 font-medium text-slate-500">{format(new Date(log.clock_in), "HH:mm")} - {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "..."}</TableCell><TableCell className="py-2 px-4 text-right font-bold text-[#4B7BEC]">{log.duration_minutes}m</TableCell></TableRow>
                                                                ))}</TableBody>
                                                            </Table>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="history" className="pt-6">
                                                    <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {isLoadingActivities ? (<div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#4B7BEC] opacity-20" /></div>) : auditLogs.length === 0 ? (<div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No activity logs</div>) : auditLogs.map((log, i) => (
                                                            <div key={log.id} className="flex gap-4 relative">
                                                                {i !== auditLogs.length - 1 && <div className="absolute left-[7px] top-4 bottom-[-20px] w-0.5 bg-slate-100" />}
                                                                <div className="h-4 w-4 rounded-full border-2 border-slate-200 bg-white z-10 flex items-center justify-center shrink-0 mt-0.5"><div className="h-1.5 w-1.5 rounded-full bg-slate-300" /></div>
                                                                <div className="space-y-0.5 min-w-0"><p className="text-xs font-medium text-slate-600"><span className="font-bold text-slate-900">{log.user?.full_name || `User #${log.user_id}`}</span> {log.action.toLowerCase()}d task</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{format(new Date(log.created_at), "MMM d, yyyy · HH:mm")}</p></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-[3] bg-slate-50/50 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                                    <div className="p-8 pt-6 pb-12 space-y-8 h-full">
                                        <div className="space-y-3"><Button className="w-full h-11 gap-2 bg-[#4B7BEC] hover:bg-[#3b60c0] font-bold rounded-md uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100/30" onClick={handleClockIn} disabled={isClockingIn}>{isClockingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Clock In</Button></div>
                                        <Separator className="bg-slate-100" />
                                        <div className="space-y-6">
                                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><User2 className="h-3 w-3" /> Assignee</label>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm"><Avatar size="sm" className="rounded-md border border-slate-100"><AvatarFallback className="rounded-md font-bold text-xs bg-blue-50 text-blue-600">{currentUser?.full_name?.charAt(0)}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{currentUser?.full_name || "Self"}</p><p className="text-[10px] font-medium text-slate-400 truncate">{currentUser?.email || "No email"}</p></div></div>
                                            </div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><Briefcase className="h-3 w-3" /> Reporter</label>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm"><Avatar size="sm" className="rounded-md border border-slate-100"><AvatarFallback className="rounded-md font-bold text-xs bg-slate-100 text-slate-600">{reporter?.full_name?.charAt(0) || "?"}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{reporter?.full_name || "System"}</p><p className="text-[10px] font-medium text-slate-400 truncate">{reporter?.email || "No email"}</p></div></div>
                                            </div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><CalendarDays className="h-3 w-3" /> Due Date</label>
                                                <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm flex items-center gap-3"><div className="h-8 w-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-500"><CalendarIcon className="h-4 w-4" /></div><span className="text-sm font-bold text-slate-700">{selectedTask.due_date ? format(new Date(selectedTask.due_date), "MMM d, yyyy") : "None"}</span></div>
                                            </div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2"><Layers className="h-3 w-3" /> Project</label>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm"><div className="h-8 w-8 rounded-md bg-[#4B7BEC]/5 flex items-center justify-center text-[#4B7BEC]"><Layers className="h-4 w-4" /></div><div className="min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{getProjectName(selectedTask.project_id)}</p><p className="text-[10px] font-medium text-slate-400">ID: #{selectedTask.project_id}</p></div></div>
                                            </div>
                                            <div className="space-y-5 pt-2 pb-12">
                                                <div className="flex flex-col gap-1"><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Created At</span><span className="text-xs font-bold text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-md shadow-sm">{format(new Date(selectedTask.created_at), "dd MMM yyyy, HH:mm")}</span></div>
                                                <div className="flex flex-col gap-1"><span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Last Update</span><span className="text-xs font-bold text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-md shadow-sm">{format(new Date(selectedTask.updated_at), "dd MMM yyyy, HH:mm")}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Task Dialog */}
            <Dialog open={dialogOpen} onOpenChange={open => !isSaving && setDialogOpen(open)}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-md bg-white flex flex-col text-slate-900">
                    <DialogDescription className="sr-only">Form to create or edit a task.</DialogDescription>
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4"><DialogTitle className="text-base font-bold text-slate-900">{editingTask ? "Edit Task" : "New Task"}</DialogTitle></div>
                    <div className="px-6 py-5 space-y-3.5">
                        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Project</label><Select value={String(form.project_id || "")} onValueChange={v => setForm({ ...form, project_id: Number(v), assigned_to_id: 0 })} disabled={!!editingTask}><SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]"><SelectValue /></SelectTrigger><SelectContent className="rounded-md">{projects.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Title</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} disabled={isSaving} className="border-slate-200 h-9 shadow-sm rounded-md text-sm font-bold focus:ring-1 focus:ring-[#4B7BEC]" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Description</label><textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} disabled={isSaving} className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:ring-1 focus:ring-[#4B7BEC] focus:outline-none shadow-sm" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Due Date</label><Input type="date" value={form.due_date || ""} onChange={e => setForm({ ...form, due_date: e.target.value })} disabled={isSaving} className="border-slate-200 h-9 shadow-sm rounded-md text-sm font-bold focus:ring-1 focus:ring-[#4B7BEC]" /></div>
                        {!isEmployee && (<div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Assign To</label><Select value={String(form.assigned_to_id || "")} onValueChange={v => setForm({ ...form, assigned_to_id: Number(v) })}><SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]"><SelectValue /></SelectTrigger><SelectContent className="rounded-md">{members.map(m => (<SelectItem key={m.user_id} value={String(m.user_id)} className="text-sm font-medium">{m.user?.full_name}</SelectItem>))}</SelectContent></Select></div>)}
                        {editingTask && (<div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Status</label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="border-slate-200 h-9 rounded-md text-sm font-semibold focus:ring-1 focus:ring-[#4B7BEC]"><SelectValue /></SelectTrigger><SelectContent className="rounded-md"><SelectItem value="todo" className="text-sm font-medium">To Do</SelectItem><SelectItem value="in_progress" className="text-sm font-medium">In Progress</SelectItem><SelectItem value="done" className="text-sm font-medium">Done</SelectItem></SelectContent></Select></div>)}
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5"><Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isSaving} className="font-bold rounded-md px-5 text-xs text-slate-500 h-9">Cancel</Button><Button onClick={handleSave} disabled={isSaving} className="bg-[#4B7BEC] hover:bg-[#3b60c0] min-w-[100px] font-bold rounded-md uppercase tracking-widest text-[10px] h-9 shadow-md shadow-blue-100">{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}</Button></div>
                </DialogContent>
            </Dialog>

            {/* Day Tasks Dialog */}
            <Dialog open={dayTasksOpen} onOpenChange={setDayTasksOpen}>
                <DialogContent className="sm:max-w-[380px] rounded-md p-0 overflow-hidden border-none shadow-2xl bg-white text-slate-900">
                    <DialogDescription className="sr-only">List of tasks for the selected day.</DialogDescription>
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50"><DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#4B7BEC]" /> {selectedDate && format(selectedDate, "MMMM d, yyyy")}</DialogTitle></div>
                    <div className="p-4 max-h-[350px] overflow-y-auto space-y-2.5">{selectedDate && getTasksForDay(selectedDate).length === 0 ? (<p className="text-center py-12 text-slate-300 font-bold text-[10px] uppercase">No Assignments</p>) : selectedDate && getTasksForDay(selectedDate).map(task => (<div key={task.id} onClick={() => { setDayTasksOpen(false); handleTaskClick(task); }} className="p-4 rounded-md border border-slate-100 hover:border-[#4B7BEC]/30 hover:bg-blue-50/30 transition-all cursor-pointer group shadow-sm"><div className="flex items-center justify-between mb-1.5"><Badge variant="outline" className={`${statusConfig[task.status].badge} text-[8px] font-black px-2 py-0 rounded-full uppercase`}>{statusConfig[task.status].label}</Badge><span className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{getProjectName(task.project_id)}</span></div><p className="text-xs font-bold text-slate-800 group-hover:text-[#4B7BEC] line-clamp-1">{task.title}</p></div>))}</div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={open => !isDeleting && setDeleteOpen(open)}>
                <DialogContent className="sm:max-w-[340px] border-none shadow-2xl rounded-md p-8 bg-white flex flex-col items-center text-center text-slate-900">
                    <DialogDescription className="sr-only">Confirmation dialog to delete a task.</DialogDescription>
                    <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mb-5"><AlertTriangle className="h-7 w-7 text-red-500" /></div>
                    <DialogTitle className="text-lg font-bold text-slate-900">Delete Task?</DialogTitle>
                    <p className="text-xs text-slate-500 mt-2 font-medium">This action is permanent and cannot be undone.</p>
                    <div className="flex gap-3 w-full mt-8"><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting} className="flex-1 h-10 font-bold rounded-md text-[10px] uppercase border-slate-200">Cancel</Button><Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1 h-10 font-bold rounded-md text-[10px] uppercase shadow-lg shadow-red-100">Confirm</Button></div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

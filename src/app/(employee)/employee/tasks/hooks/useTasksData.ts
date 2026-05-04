import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { taskService, ApiTask, CreateTaskPayload, TaskComment, TaskAuditLog } from "@/lib/services/task-service";
import { projectService } from "@/lib/services/project-service";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay } from "date-fns";
import { DropResult } from "@hello-pangea/dnd";

export const PROJECT_COLORS = [
    { bg: "bg-blue-50", text: "text-blue-700", borderL: "border-l-blue-400", dot: "bg-blue-400" },
    { bg: "bg-violet-50", text: "text-violet-700", borderL: "border-l-violet-400", dot: "bg-violet-400" },
    { bg: "bg-emerald-50", text: "text-emerald-700", borderL: "border-l-emerald-400", dot: "bg-emerald-400" },
    { bg: "bg-amber-50", text: "text-amber-700", borderL: "border-l-amber-400", dot: "bg-amber-400" },
    { bg: "bg-rose-50", text: "text-rose-700", borderL: "border-l-rose-400", dot: "bg-rose-400" },
    { bg: "bg-cyan-50", text: "text-cyan-700", borderL: "border-l-cyan-400", dot: "bg-cyan-400" },
    { bg: "bg-orange-50", text: "text-orange-700", borderL: "border-l-orange-400", dot: "bg-orange-400" },
    { bg: "bg-indigo-50", text: "text-indigo-700", borderL: "border-l-indigo-400", dot: "bg-indigo-400" },
];

export function useTasksData() {
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
        const formattedDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "";
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

    return {
        state: {
            currentUser, isEmployee, projects, selectedProjectId, tasks, isLoadingProjects,
            isLoadingTasks, view, calView, members, allMembers, dialogOpen, editingTask,
            isSaving, form, detailOpen, selectedTask, taskLogs, isLoadingLogs, isClockingIn,
            comments, auditLogs, reporter, commentText, isSendingComment, isLoadingActivities,
            dayTasksOpen, selectedDate, deleteOpen, taskToDelete, isDeleting, currentMonth,
            currentTime, calendarScrollRef
        },
        computed: {
            canManageTask, grouped, calendarDays, weekDays
        },
        actions: {
            setSelectedProjectId, setView, setCalView, setDialogOpen, setForm,
            setDetailOpen, setCommentText, setDayTasksOpen, setDeleteOpen, setCurrentMonth,
            onDragEnd, openCreate, openEdit, handleSave, openDelete, handleDelete,
            handleTaskClick, handleSendComment, handleClockIn, handleDayClick,
            getTasksForDay, getProjectName, getProjectColor, navigateCalendar
        }
    };
}

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function usePMTasksData() {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(s => s.user);
    const isEmployee = false; // This is the PM hook

    // --- UI State ---
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const [view, setView] = useState<string>("kanban");
    const [calView, setCalView] = useState<"day" | "week" | "month">("month");
    const [taskSearch, setTaskSearch] = useState("");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
    const [form, setForm] = useState<CreateTaskPayload & { status?: string }>({
        project_id: 0, assigned_to_id: 0, title: "", description: "", status: "todo", due_date: ""
    });
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [commentText, setCommentText] = useState("");
    const [dayTasksOpen, setDayTasksOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<ApiTask | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const calendarScrollRef = useRef<HTMLDivElement>(null);

    // --- Queries ---

    // 1. Projects
    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['pm', 'tasks', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects: ApiProject[] = projectsData?.data || [];

    // 2. Tasks
    const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['pm', 'tasks', 'list', selectedProjectId, projects.length],
        queryFn: async () => {
            if (selectedProjectId === "all") {
                if (projects.length === 0) return [];
                const allPromises = projects.map(p => taskService.getProjectTasks(String(p.id)));
                const results = await Promise.all(allPromises);
                return results.flat() as ApiTask[];
            }
            return await taskService.getProjectTasks(selectedProjectId) as ApiTask[];
        },
        enabled: !isLoadingProjects,
    });
    const tasks: ApiTask[] = Array.isArray(tasksData) ? tasksData : [];

    // 3. All Members (Map)
    const taskProjectIds = useMemo(() => Array.from(new Set(tasks.map(t => t.project_id))), [tasks]);
    const { data: allMembersMap } = useQuery({
        queryKey: ['pm', 'tasks', 'members-map', taskProjectIds],
        queryFn: async () => {
            const map: Record<number, ProjectMember[]> = {};
            await Promise.all(taskProjectIds.map(async (pid) => {
                try {
                    const m = await projectService.getProjectMembers(String(pid));
                    map[pid] = Array.isArray(m) ? m : [];
                } catch {
                    map[pid] = [];
                }
            }));
            return map;
        },
        enabled: taskProjectIds.length > 0,
    });
    const allMembers = allMembersMap || {};

    // 4. Form Members
    const { data: formMembersData } = useQuery({
        queryKey: ['pm', 'tasks', 'form-members', form.project_id],
        queryFn: () => projectService.getProjectMembers(String(form.project_id)),
        enabled: !!form.project_id && dialogOpen,
    });
    const members: ProjectMember[] = Array.isArray(formMembersData) ? formMembersData : [];

    // 5. Task Details
    const taskId = selectedTask?.id;
    const { data: taskLogsData, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['pm', 'tasks', 'logs', taskId],
        queryFn: () => timesheetService.getTaskTimesheets(taskId!),
        enabled: !!taskId && detailOpen,
    });
    const taskLogs = Array.isArray(taskLogsData) ? taskLogsData : [];

    const { data: commentsData } = useQuery({
        queryKey: ['pm', 'tasks', 'comments', taskId],
        queryFn: () => taskService.getTaskComments(taskId!),
        enabled: !!taskId && detailOpen,
    });
    const comments = Array.isArray(commentsData) ? commentsData : [];

    const { data: auditLogsRaw, isLoading: isLoadingActivities } = useQuery({
        queryKey: ['pm', 'tasks', 'audit', taskId],
        queryFn: () => taskService.getTaskLogs(taskId!),
        enabled: !!taskId && detailOpen,
    });
    
    const { auditLogs, reporter, assignee } = useMemo(() => {
        if (!auditLogsRaw || !selectedTask) return { auditLogs: [], reporter: null, assignee: null };
        const pMembers = allMembers[selectedTask.project_id] || [];
        const resolvedAuds = auditLogsRaw.map((log: TaskAuditLog) => {
            const actor = pMembers.find(m => m.user_id === log.user_id);
            return {
                ...log,
                user: actor?.user || (log.user_id === Number(currentUser?.id) ? { full_name: currentUser?.full_name || "You" } : log.user)
            };
        });
        const foundReporter = pMembers.find(m => m.user_id === selectedTask.created_by_id);
        let resolvedReporter: User | null = null;
        if (foundReporter?.user) resolvedReporter = { ...foundReporter.user, id: String(foundReporter.user.id) } as User;

        const foundAssignee = pMembers.find(m => m.user_id === selectedTask.assigned_to_id);
        let resolvedAssignee: User | null = null;
        if (foundAssignee?.user) resolvedAssignee = { ...foundAssignee.user, id: String(foundAssignee.user.id) } as User;
        else if (selectedTask.assigned_to_id === Number(currentUser?.id)) resolvedAssignee = currentUser as unknown as User;

        return { auditLogs: resolvedAuds, reporter: resolvedReporter, assignee: resolvedAssignee };
    }, [auditLogsRaw, selectedTask, allMembers, currentUser]);

    // --- Mutations ---
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: number, status: string }) => 
            taskService.updateTaskStatus(taskId, { status: status as any }),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'tasks', 'list', selectedProjectId] });
        },
        onSuccess: () => toast.success("Task status updated"),
        onError: () => toast.error("Failed to update status")
    });

    const saveTaskMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingTask) {
                return taskService.updateTask(editingTask.id, {
                    title: payload.title,
                    description: payload.description,
                    assigned_to_id: payload.assigned_to_id,
                    status: payload.status,
                    due_date: payload.due_date
                });
            } else {
                return taskService.createTask(payload);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'tasks', 'list', selectedProjectId] });
            setDialogOpen(false);
        },
        onSuccess: () => toast.success(editingTask ? "Task updated" : "Task created"),
        onError: () => toast.error("Failed to save task")
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: number) => taskService.deleteTask(taskId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'tasks', 'list', selectedProjectId] });
            setDeleteOpen(false);
        },
        onSuccess: () => toast.success("Task deleted"),
        onError: () => toast.error("Failed to delete task")
    });

    const commentMutation = useMutation({
        mutationFn: (text: string) => taskService.addTaskComment(taskId!, text),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'tasks', 'comments', taskId] });
            setCommentText("");
        },
        onSuccess: () => toast.success("Comment added"),
        onError: () => toast.error("Failed to add comment")
    });

    // --- Helper Logic ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const uniqueMembers = useMemo(() => {
        const map = new Map<number, ProjectMember>();
        Object.values(allMembers).forEach(membersArr => {
            membersArr.forEach(m => {
                if (!map.has(m.user_id)) map.set(m.user_id, m);
            });
        });
        return Array.from(map.values());
    }, [allMembers]);

    const filteredTasks = useMemo(() => {
        const q = taskSearch.toLowerCase();
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(q) || (t.description?.toLowerCase() || "").includes(q);
            const matchesAssignee = assigneeFilter === "all" || String(t.assigned_to_id) === assigneeFilter;
            return matchesSearch && matchesAssignee;
        });
    }, [tasks, taskSearch, assigneeFilter]);

    const grouped = useMemo(() => {
        const sortDesc = (a: ApiTask, b: ApiTask) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return {
            todo: filteredTasks.filter(t => t.status === "todo").sort(sortDesc),
            in_progress: filteredTasks.filter(t => t.status === "in_progress").sort(sortDesc),
            done: filteredTasks.filter(t => t.status === "done").sort(sortDesc),
        };
    }, [filteredTasks]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
    }, [currentMonth]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentMonth);
        return eachDayOfInterval({ start, end: endOfWeek(start) });
    }, [currentMonth]);

    const getTasksForDay = (day: Date) => filteredTasks.filter(t => isSameDay(day, t.due_date ? new Date(t.due_date) : new Date(t.created_at)));
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

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId) return;
        updateStatusMutation.mutate({ taskId: Number(draggableId), status: destination.droppableId });
    };

    const openCreate = () => {
        setEditingTask(null);
        setForm({ project_id: selectedProjectId === "all" ? 0 : Number(selectedProjectId), assigned_to_id: 0, title: "", description: "", status: "todo", due_date: "" });
        setDialogOpen(true);
    };

    const openEdit = (task: ApiTask) => {
        setEditingTask(task);
        setForm({ project_id: task.project_id, assigned_to_id: task.assigned_to_id, title: task.title, description: task.description || "", status: task.status, due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "" });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.project_id || !form.title || !form.assigned_to_id) { 
            toast.error("Missing required fields (Project, Title, and Assignee are required)"); 
            return; 
        }

        const payload: any = {
            ...form,
            project_id: Number(form.project_id),
            assigned_to_id: Number(form.assigned_to_id)
        };

        // Sanitize due_date: backend (Go) fails to bind empty strings to *time.Time
        if (!payload.due_date || payload.due_date === "") {
            delete payload.due_date;
        } else {
            try {
                payload.due_date = new Date(payload.due_date).toISOString();
            } catch (e) {
                delete payload.due_date;
            }
        }

        saveTaskMutation.mutate(payload);
    };

    return {
        state: { currentUser, isEmployee, projects, selectedProjectId, tasks, isLoadingProjects, isLoadingTasks, view, calView, members, allMembers, uniqueMembers, taskSearch, assigneeFilter, dialogOpen, editingTask, isSaving: saveTaskMutation.isPending, form, detailOpen, selectedTask, taskLogs, isLoadingLogs, comments, auditLogs, reporter, assignee, commentText, isSendingComment: commentMutation.isPending, isLoadingActivities, dayTasksOpen, selectedDate, deleteOpen, taskToDelete, isDeleting: deleteTaskMutation.isPending, currentMonth, currentTime, calendarScrollRef },
        computed: { canManageTask: true, grouped, calendarDays, weekDays },
        actions: { setSelectedProjectId, setView, setCalView, setTaskSearch, setAssigneeFilter, setDialogOpen, setForm, setDetailOpen, setCommentText, setDayTasksOpen, setDeleteOpen, setCurrentMonth, onDragEnd, openCreate, openEdit, handleSave, openDelete: (t: ApiTask) => { setTaskToDelete(t); setDeleteOpen(true); }, handleDelete: async () => { if (taskToDelete) deleteTaskMutation.mutate(taskToDelete.id); }, handleTaskClick: (t: ApiTask) => { setSelectedTask(t); setDetailOpen(true); }, handleSendComment: async () => { if (commentText.trim()) commentMutation.mutate(commentText); }, handleDayClick: (d: Date) => { setSelectedDate(d); setDayTasksOpen(true); }, getTasksForDay, getProjectName, getProjectColor, navigateCalendar }
    };
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

export function useTasksData() {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(s => s.user);
    const isEmployee = currentUser?.role === "employee";

    // --- UI State (Zustand & Local) ---
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
    const [view, setView] = useState<string>("kanban");
    const [calView, setCalView] = useState<"day" | "week" | "month">("month");
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
        queryKey: ['employee', 'tasks', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects: ApiProject[] = projectsData?.data || [];

    // 2. Tasks
    const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['employee', 'tasks', 'list', selectedProjectId, selectedProjectId === "all" ? projects.map(p => p.id) : null],
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

    // 3. All Members (Map) - for Kanban/List views
    const taskProjectIds = useMemo(() => Array.from(new Set(tasks.map(t => t.project_id))), [tasks]);
    const { data: allMembersMap } = useQuery({
        queryKey: ['employee', 'tasks', 'members-map', taskProjectIds],
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

    // 4. Form Members (when creating/editing)
    const { data: formMembersData } = useQuery({
        queryKey: ['employee', 'tasks', 'form-members', form.project_id],
        queryFn: () => projectService.getProjectMembers(String(form.project_id)),
        enabled: !!form.project_id && !isEmployee && dialogOpen,
    });
    const members: ProjectMember[] = Array.isArray(formMembersData) ? formMembersData : [];

    // 5. Task Details (Dependent on selectedTask)
    const taskId = selectedTask?.id;
    const { data: taskLogsData, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['employee', 'tasks', 'logs', taskId],
        queryFn: () => timesheetService.getTaskTimesheets(taskId!),
        enabled: !!taskId && detailOpen,
    });
    const taskLogs = Array.isArray(taskLogsData) ? taskLogsData : [];

    const { data: commentsData } = useQuery({
        queryKey: ['employee', 'tasks', 'comments', taskId],
        queryFn: () => taskService.getTaskComments(taskId!),
        enabled: !!taskId && detailOpen,
    });
    const comments = Array.isArray(commentsData) ? commentsData : [];

    const { data: auditLogsRaw, isLoading: isLoadingActivities } = useQuery({
        queryKey: ['employee', 'tasks', 'audit', taskId],
        queryFn: () => taskService.getTaskLogs(taskId!),
        enabled: !!taskId && detailOpen,
    });
    
    // Process audit logs, reporter, and assignee
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
        if (foundReporter && foundReporter.user) {
            resolvedReporter = { ...foundReporter.user, id: String(foundReporter.user.id) } as User;
        } else if (selectedTask.created_by_id === Number(currentUser?.id)) {
            resolvedReporter = currentUser as User;
        }

        const foundAssignee = pMembers.find(m => m.user_id === selectedTask.assigned_to_id);
        let resolvedAssignee: User | null = null;
        if (foundAssignee && foundAssignee.user) {
            resolvedAssignee = { ...foundAssignee.user, id: String(foundAssignee.user.id) } as User;
        } else if (selectedTask.assigned_to_id === Number(currentUser?.id)) {
            resolvedAssignee = currentUser as User;
        }

        return { auditLogs: resolvedAuds, reporter: resolvedReporter, assignee: resolvedAssignee };
    }, [auditLogsRaw, selectedTask, allMembers, currentUser]);

    // --- Mutations ---

    // 1. Update Status (Optimistic UI)
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: number, status: string }) => 
            taskService.updateTaskStatus(taskId, { status: status as any }),
        onMutate: async ({ taskId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['employee', 'tasks', 'list', selectedProjectId] });
            const previousTasks = queryClient.getQueryData(['employee', 'tasks', 'list', selectedProjectId]);
            
            queryClient.setQueryData(['employee', 'tasks', 'list', selectedProjectId], (old: ApiTask[] | undefined) => {
                if (!old) return [];
                return old.map(t => t.id === taskId ? { ...t, status: status as any } : t);
            });
            
            return { previousTasks };
        },
        onError: (err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['employee', 'tasks', 'list', selectedProjectId], context.previousTasks);
            }
            toast.error("Failed to update task status");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'tasks', 'list', selectedProjectId] });
        },
        onSuccess: () => {
            toast.success("Task status updated");
        }
    });

    // 2. Save Task (Create/Update)
    const saveTaskMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingTask) {
                return taskService.updateTask(editingTask.id, {
                    title: payload.title,
                    description: payload.description,
                    status: payload.status,
                    due_date: payload.due_date
                });
            } else {
                return taskService.createTask(payload);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'tasks', 'list', selectedProjectId] });
            setDialogOpen(false);
        },
        onSuccess: () => {
            toast.success(editingTask ? "Task updated" : "Task created");
        },
        onError: () => {
            toast.error("Failed to save task");
        }
    });

    // 3. Delete Task
    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: number) => taskService.deleteTask(taskId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'tasks', 'list', selectedProjectId] });
            setDeleteOpen(false);
        },
        onSuccess: () => {
            toast.success("Task deleted");
        },
        onError: () => {
            toast.error("Failed to delete task");
        }
    });

    // 4. Comment
    const commentMutation = useMutation({
        mutationFn: (text: string) => taskService.addTaskComment(taskId!, text),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'tasks', 'comments', taskId] });
            setCommentText("");
        },
        onSuccess: () => {
            toast.success("Comment added");
        },
        onError: () => {
            toast.error("Failed to add comment");
        }
    });

    // 5. Clock In
    const clockInMutation = useMutation({
        mutationFn: async () => {
            if (selectedTask!.status !== "in_progress") {
                await taskService.updateTaskStatus(selectedTask!.id, { status: "in_progress" });
            }
            return timesheetService.clockIn({ project_id: selectedTask!.project_id, task_id: selectedTask!.id });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'tasks', 'list', selectedProjectId] });
            setDetailOpen(false);
        },
        onSuccess: () => {
            toast.success("Clocked in & Task moved to In Progress");
        },
        onError: () => {
            toast.error("Failed to clock in");
        }
    });

    // --- Helper Effects & Memo ---
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

    const grouped = useMemo(() => {
        const sortDesc = (a: ApiTask, b: ApiTask) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return {
            todo: tasks.filter(t => t.status === "todo").sort(sortDesc),
            in_progress: tasks.filter(t => t.status === "in_progress").sort(sortDesc),
            done: tasks.filter(t => t.status === "done").sort(sortDesc),
        };
    }, [tasks]);

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

    // --- Actions ---
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId) return;
        updateStatusMutation.mutate({ taskId: Number(draggableId), status: destination.droppableId });
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
        
        const payload: any = { 
            project_id: Number(form.project_id), 
            title: form.title, 
            description: form.description || undefined,
            due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
            status: form.status
        };
        if (!isEmployee && form.assigned_to_id) payload.assigned_to_id = Number(form.assigned_to_id);
        
        saveTaskMutation.mutate(payload);
    };

    const openDelete = (task: ApiTask) => {
        setTaskToDelete(task);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (taskToDelete) deleteTaskMutation.mutate(taskToDelete.id);
    };

    const handleTaskClick = (task: ApiTask) => {
        setSelectedTask(task);
        setDetailOpen(true);
    };

    const handleSendComment = async () => {
        if (commentText.trim()) commentMutation.mutate(commentText);
    };

    const handleClockIn = async () => {
        clockInMutation.mutate();
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setDayTasksOpen(true);
    };

    return {
        state: {
            currentUser, isEmployee, projects, selectedProjectId, tasks, 
            isLoadingProjects, isLoadingTasks, view, calView, members, allMembers, 
            dialogOpen, editingTask, isSaving: saveTaskMutation.isPending, 
            form, detailOpen, selectedTask, taskLogs, isLoadingLogs, 
            isClockingIn: clockInMutation.isPending, comments, auditLogs, reporter, assignee,
            commentText, isSendingComment: commentMutation.isPending, 
            isLoadingActivities, dayTasksOpen, selectedDate, deleteOpen, 
            taskToDelete, isDeleting: deleteTaskMutation.isPending, 
            currentMonth, currentTime, calendarScrollRef
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

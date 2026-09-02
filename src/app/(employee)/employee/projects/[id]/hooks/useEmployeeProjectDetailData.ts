import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { timesheetService } from "@/lib/services/timesheet-service";
import { useAuthStore } from "@/store/useAuthStore";
import { ProjectMember } from "@/lib/types";
import { toast } from "sonner";

export function useEmployeeProjectDetailData(projectId: string) {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(s => s.user);

    // --- UI State ---
    const [activeTab, setActiveTab] = useState("Overview");

    // Filters
    const [taskSearch, setTaskSearch] = useState("");
    const [taskFilterStatus, setTaskFilterStatus] = useState("all");
    const [taskFilterAssignee, setTaskFilterAssignee] = useState("all");

    // Dialog state for Task Detail
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);
    const [commentText, setCommentText] = useState("");

    // Form/Edit state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
    const [form, setForm] = useState<any>({
        project_id: Number(projectId), assigned_to_id: 0, title: "", description: "", status: "todo", due_date: ""
    });

    // Delete state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<ApiTask | null>(null);

    // --- Queries ---
    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ['employee', 'project', projectId],
        queryFn: () => projectService.getProjectById(projectId),
        enabled: !!projectId,
    });

    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['employee', 'project', projectId, 'members'],
        queryFn: () => projectService.getProjectMembers(projectId),
        enabled: !!projectId,
    });

    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['employee', 'project', projectId, 'tasks'],
        queryFn: () => taskService.getProjectTasks(projectId, true),
        enabled: !!projectId,
    });

    // Queries for Task Detail (only if open)
    const taskId = selectedTask?.id;
    const { data: taskLogs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['task', taskId, 'logs'],
        queryFn: () => timesheetService.getTaskTimesheets(taskId!),
        enabled: !!taskId && taskDetailOpen,
    });

    const { data: comments = [] } = useQuery({
        queryKey: ['task', taskId, 'comments'],
        queryFn: () => taskService.getTaskComments(taskId!),
        enabled: !!taskId && taskDetailOpen,
    });

    const { data: auditLogs = [], isLoading: isLoadingActivities } = useQuery({
        queryKey: ['task', taskId, 'audit'],
        queryFn: () => taskService.getTaskLogs(taskId!),
        enabled: !!taskId && taskDetailOpen,
    });

    const isLoading = isLoadingProject || isLoadingMembers || isLoadingTasks;

    // --- Mutations ---
    const commentMutation = useMutation({
        mutationFn: (text: string) => taskService.addTaskComment(taskId!, text),
        onSuccess: () => {
            toast.success("Comment added");
            queryClient.invalidateQueries({ queryKey: ['task', taskId, 'comments'] });
            setCommentText("");
        },
        onError: (e: any) => toast.error(e.message || "Failed to add comment")
    });

    const clockInMutation = useMutation({
        mutationFn: async () => {
            if (selectedTask!.status !== "in_progress") {
                await taskService.updateTaskStatus(selectedTask!.id, { status: "in_progress" });
            }
            return timesheetService.clockIn({ project_id: selectedTask!.project_id, task_id: selectedTask!.id });
        },
        onSuccess: () => {
            toast.success("Clocked in successfully");
            queryClient.invalidateQueries({ queryKey: ['employee', 'project', projectId, 'tasks'] });
            queryClient.invalidateQueries({ queryKey: ['employee', 'timesheets'] });
            queryClient.invalidateQueries({ queryKey: ['employee', 'timesheets', 'logs'] });
            setTaskDetailOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to clock in")
    });

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
            queryClient.invalidateQueries({ queryKey: ['employee', 'project', projectId, 'tasks'] });
            setDialogOpen(false);
        },
        onSuccess: () => toast.success(editingTask ? "Task updated" : "Task created"),
        onError: () => toast.error("Failed to save task")
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: number) => taskService.deleteTask(taskId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'project', projectId, 'tasks'] });
            setDeleteOpen(false);
            setTaskDetailOpen(false);
        },
        onSuccess: () => toast.success("Task deleted"),
        onError: () => toast.error("Failed to delete task")
    });

    // --- Computed ---
    const filteredTasks = useMemo(() => {
        const q = taskSearch.toLowerCase();
        return (tasks as ApiTask[]).filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(q) || (t.description?.toLowerCase() || "").includes(q);
            const matchesStatus = taskFilterStatus === "all" || t.status === taskFilterStatus;
            const matchesAssignee = taskFilterAssignee === "all" || String(t.assigned_to_id) === taskFilterAssignee;
            return matchesSearch && matchesStatus && matchesAssignee;
        });
    }, [tasks, taskSearch, taskFilterStatus, taskFilterAssignee]);

    const filteredMembers = useMemo(() => {
        if (!taskSearch.trim() || activeTab !== "Teams") return members;
        const q = taskSearch.toLowerCase();
        return (members as ProjectMember[]).filter(m =>
            (m.user?.full_name?.toLowerCase() || "").includes(q) ||
            (m.user?.email?.toLowerCase() || "").includes(q) ||
            (m.role_in_project?.toLowerCase() || "").includes(q)
        );
    }, [members, taskSearch, activeTab]);

    const stats = {
        todo: (tasks as ApiTask[]).filter(t => t.status === "todo").length,
        in_progress: (tasks as ApiTask[]).filter(t => t.status === "in_progress").length,
        done: (tasks as ApiTask[]).filter(t => t.status === "done").length,
    };

    const canManageTask = useMemo(() => {
        if (!selectedTask || !currentUser) return false;
        return selectedTask.created_by_id === Number(currentUser.id);
    }, [selectedTask, currentUser]);

    // --- Handlers ---
    const handleTaskClick = (task: ApiTask) => {
        if (currentUser && String(task.assigned_to_id) !== String(currentUser.id)) {
            toast.info("You can only view details for tasks assigned to you");
            return;
        }
        setSelectedTask(task);
        setTaskDetailOpen(true);
    };

    const handleSendComment = () => {
        if (commentText.trim()) commentMutation.mutate(commentText);
    };

    const handleClockIn = () => {
        clockInMutation.mutate();
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
        if (!form.title) { toast.error("Title is required"); return; }
        
        const payload: any = { 
            project_id: Number(projectId), 
            title: form.title, 
            description: form.description || undefined,
            due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
            status: form.status
        };
        saveTaskMutation.mutate(payload);
    };

    const openDelete = (task: ApiTask) => {
        setTaskToDelete(task);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (taskToDelete) deleteTaskMutation.mutate(taskToDelete.id);
    };

    return {
        state: {
            project,
            members,
            filteredMembers,
            tasks,
            isLoading,
            activeTab,
            taskSearch,
            taskFilterStatus,
            taskFilterAssignee,
            filteredTasks,
            stats,
            currentUser,
            // Task Detail state
            selectedTask,
            taskDetailOpen,
            taskLogs,
            isLoadingLogs,
            comments,
            auditLogs,
            isLoadingActivities,
            commentText,
            isSendingComment: commentMutation.isPending,
            isClockingIn: clockInMutation.isPending,
            canManageTask,
            dialogOpen,
            editingTask,
            form,
            isSaving: saveTaskMutation.isPending,
            deleteOpen,
            taskToDelete,
            isDeleting: deleteTaskMutation.isPending
        },
        actions: {
            setActiveTab,
            setTaskSearch,
            setTaskFilterStatus,
            setTaskFilterAssignee,
            setSelectedTask,
            setTaskDetailOpen,
            setCommentText,
            handleTaskClick,
            handleSendComment,
            handleClockIn,
            setDialogOpen,
            setForm,
            openEdit,
            handleSave,
            openDelete,
            setDeleteOpen,
            handleDelete
        }
    };
}

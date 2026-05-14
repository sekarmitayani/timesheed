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
            setTaskDetailOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to clock in")
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
            isClockingIn: clockInMutation.isPending
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
            handleClockIn
        }
    };
}

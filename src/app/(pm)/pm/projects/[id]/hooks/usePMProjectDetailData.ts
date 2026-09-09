import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { taskService, CreateTaskPayload, UpdateTaskPayload, ApiTask } from "@/lib/services/task-service";
import { resourceService, CreateResourcePayload, EditResourcePayload, ResourceRequest } from "@/lib/services/resource-service";
import { ApiProject, ProjectMember } from "@/lib/types";
import { toast } from "sonner";

export function usePMProjectDetailData(projectId: string) {
    const queryClient = useQueryClient();

    // --- UI State ---
    const [activeTab, setActiveTab] = useState("Overview");

    // Filters
    const [taskSearch, setTaskSearch] = useState("");
    const [taskFilterStatus, setTaskFilterStatus] = useState("all");
    const [taskFilterAssignee, setTaskFilterAssignee] = useState("all");
    const [resSearch, setResSearch] = useState("");
    const [resFilterStatus, setResFilterStatus] = useState("all");

    // Modal States
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [taskEditing, setTaskEditing] = useState<ApiTask | null>(null);
    const [resDialogOpen, setResDialogOpen] = useState(false);
    const [resEditing, setResEditing] = useState<ResourceRequest | null>(null);
    const [resDetailOpen, setResDetailOpen] = useState(false);
    const [selectedRes, setSelectedRes] = useState<ResourceRequest | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "task" | "resource"; id: number; title: string } | null>(null);

    // Form States
    const [taskForm, setTaskForm] = useState<CreateTaskPayload & { status?: string }>({ 
        project_id: Number(projectId), title: "", description: "", assigned_to_id: 0 
    });
    const [resForm, setResForm] = useState<CreateResourcePayload>({ 
        project_id: Number(projectId), type: "" as any, details: "" 
    });

    // --- Queries ---
    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ['pm', 'project', projectId],
        queryFn: () => projectService.getProjectById(projectId),
        enabled: !!projectId,
    });

    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['pm', 'project', projectId, 'members'],
        queryFn: () => projectService.getProjectMembers(projectId),
        enabled: !!projectId,
    });

    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['pm', 'project', projectId, 'tasks'],
        queryFn: () => taskService.getProjectTasks(projectId),
        enabled: !!projectId,
    });

    const { data: resourcesResponse, isLoading: isLoadingResources } = useQuery({
        queryKey: ['pm', 'project', projectId, 'resources'],
        queryFn: () => resourceService.getResourceRequests({ project_id: projectId }),
        enabled: !!projectId,
    });
    const resources = Array.isArray(resourcesResponse?.data) ? resourcesResponse.data : (Array.isArray(resourcesResponse) ? resourcesResponse : []);

    const isLoading = isLoadingProject || isLoadingMembers || isLoadingTasks || isLoadingResources;

    // --- Mutations ---
    const saveTaskMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (taskEditing) {
                return taskService.updateTask(taskEditing.id, payload);
            }
            return taskService.createTask(payload);
        },
        onSuccess: () => {
            toast.success(taskEditing ? "Task updated" : "Task created");
            queryClient.invalidateQueries({ queryKey: ['pm', 'project', projectId, 'tasks'] });
            setTaskDialogOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to save task")
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id: number) => taskService.deleteTask(id),
        onSuccess: () => {
            toast.success("Task deleted");
            queryClient.invalidateQueries({ queryKey: ['pm', 'project', projectId, 'tasks'] });
            setDeleteTarget(null);
        },
        onError: (e: any) => toast.error(e.message || "Failed to delete task")
    });

    const saveResMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (resEditing) {
                return resourceService.editResource(resEditing.id, payload);
            }
            return resourceService.createResourceRequest(payload);
        },
        onSuccess: () => {
            toast.success(resEditing ? "Resource updated" : "Resource request submitted");
            queryClient.invalidateQueries({ queryKey: ['pm', 'project', projectId, 'resources'] });
            setResDialogOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to save resource request")
    });

    const deleteResMutation = useMutation({
        mutationFn: (id: number) => resourceService.deleteResourceRequest(id),
        onSuccess: () => {
            toast.success("Resource request deleted");
            queryClient.invalidateQueries({ queryKey: ['pm', 'project', projectId, 'resources'] });
            setDeleteTarget(null);
            setResDetailOpen(false);
        },
        onError: (e: any) => toast.error(e.message || "Failed to delete resource request")
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

    const filteredResources = useMemo(() => {
        const q = resSearch.toLowerCase();
        return (resources as ResourceRequest[]).filter(r => {
            const matchesSearch = r.details.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
            const matchesStatus = resFilterStatus === "all" || r.status === resFilterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [resources, resSearch, resFilterStatus]);

    const stats = {
        todo: (tasks as ApiTask[]).filter(t => t.status === "todo").length,
        in_progress: (tasks as ApiTask[]).filter(t => t.status === "in_progress").length,
        done: (tasks as ApiTask[]).filter(t => t.status === "done").length,
    };

    // --- Handlers ---
    const openCreateTask = () => {
        setTaskEditing(null);
        setTaskForm({ project_id: Number(projectId), title: "", description: "", assigned_to_id: 0, due_date: undefined });
        setTaskDialogOpen(true);
    };

    const openEditTask = (t: ApiTask) => {
        setTaskEditing(t);
        setTaskForm({ project_id: t.project_id, title: t.title, description: t.description, assigned_to_id: t.assigned_to_id, status: t.status, due_date: t.due_date });
        setTaskDialogOpen(true);
    };

    const openCreateRes = () => {
        setResEditing(null);
        setResForm({ project_id: Number(projectId), type: "" as any, details: "" });
        setResDialogOpen(true);
    };

    const openEditRes = (r: ResourceRequest) => {
        setResEditing(r);
        setResForm({ project_id: r.project_id, type: r.type, details: r.details });
        setResDialogOpen(true);
    };

    const handleSaveTask = () => {
        if (!taskForm.title.trim()) { toast.error("Title is required"); return; }
        if (!taskForm.assigned_to_id) { toast.error("Assignee is required"); return; }

        const payload: any = { ...taskForm };
        if (!taskEditing) delete payload.status;

        // Sanitize due_date if it exists in the form (future-proofing)
        if (payload.due_date === "" || !payload.due_date) {
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

    const handleSaveRes = () => {
        if (!resForm.details.trim()) { toast.error("Details are required"); return; }
        saveResMutation.mutate(resForm);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "task") {
            deleteTaskMutation.mutate(deleteTarget.id);
        } else {
            deleteResMutation.mutate(deleteTarget.id);
        }
    };

    return {
        state: {
            project, members, tasks, resources, isLoading,
            activeTab, taskSearch, taskFilterStatus, taskFilterAssignee, resSearch, resFilterStatus,
            taskDialogOpen, taskEditing, resDialogOpen, resEditing, resDetailOpen, selectedRes, deleteTarget,
            taskForm, resForm, filteredTasks, filteredResources, stats,
            isSaving: saveTaskMutation.isPending || saveResMutation.isPending,
            isDeleting: deleteTaskMutation.isPending || deleteResMutation.isPending
        },
        actions: {
            setActiveTab, setTaskSearch, setTaskFilterStatus, setTaskFilterAssignee, setResSearch, setResFilterStatus,
            setTaskDialogOpen, setResDialogOpen, setResDetailOpen, setSelectedRes, setDeleteTarget,
            setTaskForm, setResForm,
            openCreateTask, openEditTask, openCreateRes, openEditRes,
            handleSaveTask, handleSaveRes, handleSaveResource: handleSaveRes, confirmDelete
        }
    };
}

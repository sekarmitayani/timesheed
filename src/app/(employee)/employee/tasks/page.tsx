"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { Plus, Loader2, ArrowRight, CheckCircle2, Circle, PlayCircle, ListTodo, Pencil, Trash2, AlertTriangle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { taskService, ApiTask, CreateTaskPayload, UpdateTaskPayload } from "@/lib/services/task-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject, ProjectMember } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export default function TasksPage() {
    const currentUser = useAuthStore(s => s.user);
    const isEmployee = currentUser?.role === "employee";

    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    // Members for assign dropdown
    const [members, setMembers] = useState<ProjectMember[]>([]);

    // Create/Edit Task
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<CreateTaskPayload & { status?: string }>({
        project_id: 0, assigned_to_id: 0, title: "", description: "", status: "todo"
    });

    // Delete Task
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<ApiTask | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch projects
    useEffect(() => {
        const load = async () => {
            try {
                const res = await projectService.getProjects(1, 100);
                setProjects(res.data || []);
                if (res.data?.length) {
                    setSelectedProjectId(String(res.data[0].id));
                }
            } catch (e: any) {
                toast.error(e.message || "Failed to load projects");
            } finally {
                setIsLoadingProjects(false);
            }
        };
        load();
    }, []);

    // Fetch tasks when project changes
    const fetchTasks = useCallback(async () => {
        if (!selectedProjectId) return;
        setIsLoadingTasks(true);
        try {
            const res = await taskService.getProjectTasks(selectedProjectId);
            setTasks(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to load tasks");
        } finally {
            setIsLoadingTasks(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchTasks();

        // Also fetch members for the project
        const loadMembers = async () => {
            try {
                const res = await projectService.getProjectMembers(selectedProjectId);
                setMembers(Array.isArray(res) ? res : []);
            } catch { /* skip */ }
        };
        if (!isEmployee) loadMembers();
    }, [selectedProjectId, fetchTasks, isEmployee]);

    const handleStatusChange = async (task: ApiTask, newStatus: "todo" | "in_progress" | "done") => {
        try {
            await taskService.updateTaskStatus(task.id, { status: newStatus });
            toast.success(`Task "${task.title}" → ${statusConfig[newStatus].label}`);
            fetchTasks();
        } catch (e: any) {
            toast.error(e.message || "Failed to update status");
        }
    };

    const openCreate = () => {
        setEditingTask(null);
        setForm({
            project_id: Number(selectedProjectId),
            assigned_to_id: 0,
            title: "",
            description: "",
            status: "todo"
        });
        setDialogOpen(true);
    };

    const openEdit = (task: ApiTask) => {
        setEditingTask(task);
        setForm({
            project_id: task.project_id,
            assigned_to_id: task.assigned_to_id,
            title: task.title,
            description: task.description || "",
            status: task.status
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.title) { toast.error("Title is required"); return; }
        setIsSaving(true);
        try {
            if (editingTask) {
                const payload: UpdateTaskPayload = {
                    title: form.title,
                    description: form.description || "",
                    status: form.status as any,
                };
                await taskService.updateTask(editingTask.id, payload);
                toast.success(`Task "${form.title}" updated`);
            } else {
                const payload: CreateTaskPayload = {
                    project_id: Number(selectedProjectId),
                    title: form.title,
                    description: form.description || undefined,
                };
                if (!isEmployee && form.assigned_to_id) {
                    payload.assigned_to_id = Number(form.assigned_to_id);
                }
                await taskService.createTask(payload);
                toast.success(`Task "${form.title}" created`);
            }
            setDialogOpen(false);
            fetchTasks();
        } catch (e: any) {
            toast.error(e.message || "Failed to save task");
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
            toast.success(`Task "${taskToDelete.title}" deleted`);
            setDeleteOpen(false);
            fetchTasks();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete task");
        } finally {
            setIsDeleting(false);
        }
    };

    const grouped = {
        todo: tasks.filter(t => t.status === "todo"),
        in_progress: tasks.filter(t => t.status === "in_progress"),
        done: tasks.filter(t => t.status === "done"),
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Tasks" description="Manage your project assignments">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20" onClick={openCreate} disabled={!selectedProjectId}>
                    <Plus className="h-4 w-4" /> New Task
                </Button>
            </PageHeader>

            {/* Project Selector */}
            <div className="max-w-sm">
                {isLoadingProjects ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading projects...</div>
                ) : (
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="border-[#e2e8f0] focus:ring-[#2568C1]"><SelectValue placeholder="Select project" /></SelectTrigger>
                        <SelectContent>
                            {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {isLoadingTasks ? (
                <div className="py-16 flex flex-col items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" /><p>Loading tasks...</p></div>
            ) : !selectedProjectId ? (
                <div className="py-16 text-center text-muted-foreground text-sm">Select a project to view tasks.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["todo", "in_progress", "done"] as const).map(col => {
                        const cfg = statusConfig[col];
                        const items = grouped[col];
                        return (
                            <div key={col} className="space-y-3">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cfg.bg}`}>
                                    <span className={cfg.color}>{cfg.icon}</span>
                                    <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                                    <Badge variant="outline" className="ml-auto text-[10px]">{items.length}</Badge>
                                </div>
                                <div className="space-y-2">
                                    {items.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-6">No tasks</p>
                                    ) : items.map(task => (
                                        <Card key={task.id} className="border-[#e2e8f0] hover:border-[#2568C1]/30 transition-colors group relative">
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-sm font-medium text-[#0f172a] leading-tight flex-1">{task.title}</h4>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEdit(task)} className="text-xs cursor-pointer">
                                                                <Pencil className="h-3 w-3 mr-2" /> Edit Task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openDelete(task)} className="text-xs cursor-pointer text-red-600 focus:text-red-600">
                                                                <Trash2 className="h-3 w-3 mr-2" /> Delete Task
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                {task.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>}
                                                <div className="flex gap-1 pt-1">
                                                    {col !== "todo" && (
                                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-slate-500" onClick={() => handleStatusChange(task, "todo")}>
                                                            <ArrowRight className="h-3 w-3 rotate-180 mr-1" /> To Do
                                                        </Button>
                                                    )}
                                                    {col !== "in_progress" && (
                                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-blue-600" onClick={() => handleStatusChange(task, "in_progress")}>
                                                            <PlayCircle className="h-3 w-3 mr-1" /> In Progress
                                                        </Button>
                                                    )}
                                                    {col !== "done" && (
                                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-emerald-600" onClick={() => handleStatusChange(task, "done")}>
                                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Task Dialog */}
            <Dialog open={dialogOpen} onOpenChange={open => !isSaving && setDialogOpen(open)}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg">{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {editingTask ? `Updating task in project.` : "Assign a task within the selected project."}
                        </DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" disabled={isSaving} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Description</label>
                            <Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details" disabled={isSaving} />
                        </div>
                        {!isEmployee && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Assign To</label>
                                <Select value={String(form.assigned_to_id || "")} onValueChange={v => setForm({ ...form, assigned_to_id: Number(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => (
                                            <SelectItem key={m.user_id} value={String(m.user_id)}>{m.user?.full_name || `User #${m.user_id}`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {editingTask && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[100px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTask ? "Save" : "Create"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={open => !isDeleting && setDeleteOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription className="text-xs mt-1">
                            Are you sure you want to delete &ldquo;<b>{taskToDelete?.title}</b>&rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="min-w-[90px]">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

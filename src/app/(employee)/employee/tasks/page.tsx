"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { Plus, Loader2, ArrowRight, CheckCircle2, Circle, PlayCircle, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { taskService, ApiTask, CreateTaskPayload } from "@/lib/services/task-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject, ProjectMember } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";

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

    // Create Task
    const [createOpen, setCreateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [createForm, setCreateForm] = useState<CreateTaskPayload>({
        project_id: 0, assigned_to_id: 0, title: "", description: "",
    });

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
    useEffect(() => {
        if (!selectedProjectId) return;
        const load = async () => {
            setIsLoadingTasks(true);
            try {
                const res = await taskService.getProjectTasks(selectedProjectId);
                setTasks(Array.isArray(res) ? res : []);
            } catch (e: any) {
                toast.error(e.message || "Failed to load tasks");
            } finally {
                setIsLoadingTasks(false);
            }
        };
        load();

        // Also fetch members for the project
        const loadMembers = async () => {
            try {
                const res = await projectService.getProjectMembers(selectedProjectId);
                setMembers(Array.isArray(res) ? res : []);
            } catch { /* skip */ }
        };
        if (!isEmployee) loadMembers();
    }, [selectedProjectId]);

    const handleStatusChange = async (task: ApiTask, newStatus: "todo" | "in_progress" | "done") => {
        try {
            await taskService.updateTaskStatus(task.id, { status: newStatus });
            toast.success(`Task "${task.title}" → ${statusConfig[newStatus].label}`);
            // Refresh
            const res = await taskService.getProjectTasks(selectedProjectId);
            setTasks(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to update status");
        }
    };

    const handleCreate = async () => {
        if (!createForm.title) { toast.error("Title is required"); return; }
        setIsSaving(true);
        try {
            const payload: CreateTaskPayload = {
                project_id: Number(selectedProjectId),
                title: createForm.title,
                description: createForm.description || undefined,
            };
            if (!isEmployee && createForm.assigned_to_id) {
                payload.assigned_to_id = Number(createForm.assigned_to_id);
            }
            await taskService.createTask(payload);
            toast.success(`Task "${createForm.title}" created`);
            setCreateOpen(false);
            setCreateForm({ project_id: 0, assigned_to_id: 0, title: "", description: "" });
            const res = await taskService.getProjectTasks(selectedProjectId);
            setTasks(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to create task");
        } finally {
            setIsSaving(false);
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
                <Button size="sm" className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20" onClick={() => setCreateOpen(true)} disabled={!selectedProjectId}>
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
                                        <Card key={task.id} className="border-[#e2e8f0] hover:border-[#2568C1]/30 transition-colors">
                                            <CardContent className="p-3 space-y-2">
                                                <h4 className="text-sm font-medium text-[#0f172a] leading-tight">{task.title}</h4>
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

            {/* Create Task Dialog */}
            <Dialog open={createOpen} onOpenChange={open => !isSaving && setCreateOpen(open)}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg">Create New Task</DialogTitle>
                        <DialogDescription className="text-xs">Assign a task within the selected project.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                            <Input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Fix login endpoint" disabled={isSaving} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Description</label>
                            <Input value={createForm.description || ""} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Add brute force protection" disabled={isSaving} />
                        </div>
                        {!isEmployee && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Assign To</label>
                                <Select value={String(createForm.assigned_to_id || "")} onValueChange={v => setCreateForm({ ...createForm, assigned_to_id: Number(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => (
                                            <SelectItem key={m.user_id} value={String(m.user_id)}>{m.user?.full_name || `User #${m.user_id}`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[100px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

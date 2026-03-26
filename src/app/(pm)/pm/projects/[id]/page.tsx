"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, Users, ListTodo, Package, Plus, Pencil, Trash2, Wrench, AlertTriangle, MoreVertical, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask, CreateTaskPayload, UpdateTaskPayload } from "@/lib/services/task-service";
import { resourceService, ResourceRequest, CreateResourcePayload, EditResourcePayload } from "@/lib/services/resource-service";
import { ApiProject, ProjectMember } from "@/lib/types";

/* ── Status Colors ── */
const projectStatusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    "on-hold": "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
};
const projectStatusDotColors: Record<string, string> = {
    active: "bg-emerald-500",
    completed: "bg-blue-500",
    "on-hold": "bg-amber-500",
    cancelled: "bg-red-500",
};
const taskStatusColors: Record<string, string> = {
    todo: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-50 text-blue-700",
    done: "bg-emerald-50 text-emerald-700",
};
const taskStatusDotColors: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-blue-500",
    done: "bg-emerald-500",
};
const resStatusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
};
const resStatusDotColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
};
const typeIcons: Record<string, React.ReactNode> = {
    manpower: <Users className="h-4 w-4 text-blue-500" />,
    tools: <Wrench className="h-4 w-4 text-amber-500" />,
};

/* ════════════════════════════════════════════ */
export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    /* ── Data ── */
    const [project, setProject] = useState<ApiProject | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [resources, setResources] = useState<ResourceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /* ── Task Dialog ── */
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [taskEditing, setTaskEditing] = useState<ApiTask | null>(null);
    const [taskForm, setTaskForm] = useState<CreateTaskPayload & { status?: string }>({ project_id: 0, title: "", description: "", assigned_to_id: 0 });
    const [isSavingTask, setIsSavingTask] = useState(false);

    /* ── Resource Dialog ── */
    const [resDialogOpen, setResDialogOpen] = useState(false);
    const [resEditing, setResEditing] = useState<ResourceRequest | null>(null);
    const [resForm, setResForm] = useState<CreateResourcePayload>({ project_id: 0, type: "tools", details: "" });
    const [isSavingRes, setIsSavingRes] = useState(false);

    /* ── Delete Confirm ── */
    const [deleteTarget, setDeleteTarget] = useState<{ type: "task" | "resource"; id: number; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    /* ── Fetch All ── */
    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [proj, membs, tsks, ress] = await Promise.all([
                projectService.getProjectById(projectId),
                projectService.getProjectMembers(projectId),
                taskService.getProjectTasks(projectId),
                resourceService.getResourceRequests(Number(projectId)),
            ]);
            setProject(proj);
            setMembers(Array.isArray(membs) ? membs : []);
            setTasks(Array.isArray(tsks) ? tsks : []);
            setResources(Array.isArray(ress) ? ress : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to load project details");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Task Handlers ── */
    const openCreateTask = () => {
        setTaskEditing(null);
        setTaskForm({ project_id: Number(projectId), title: "", description: "", assigned_to_id: 0 });
        setTaskDialogOpen(true);
    };
    const openEditTask = (t: ApiTask) => {
        setTaskEditing(t);
        setTaskForm({ project_id: t.project_id, title: t.title, description: t.description, assigned_to_id: t.assigned_to_id, status: t.status });
        setTaskDialogOpen(true);
    };
    const handleSaveTask = async () => {
        if (!taskForm.title.trim()) { toast.error("Title is required"); return; }
        setIsSavingTask(true);
        try {
            if (taskEditing) {
                const payload: UpdateTaskPayload = { title: taskForm.title, description: taskForm.description, assigned_to_id: taskForm.assigned_to_id || undefined, status: taskForm.status as any };
                await taskService.updateTask(taskEditing.id, payload);
                toast.success("Task updated");
            } else {
                await taskService.createTask(taskForm);
                toast.success("Task created");
            }
            setTaskDialogOpen(false);
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to save task");
        } finally {
            setIsSavingTask(false);
        }
    };

    /* ── Resource Handlers ── */
    const openCreateRes = () => {
        setResEditing(null);
        setResForm({ project_id: Number(projectId), type: "tools", details: "" });
        setResDialogOpen(true);
    };
    const openEditRes = (r: ResourceRequest) => {
        setResEditing(r);
        setResForm({ project_id: r.project_id, type: r.type, details: r.details });
        setResDialogOpen(true);
    };
    const handleSaveRes = async () => {
        if (!resForm.details.trim()) { toast.error("Details are required"); return; }
        setIsSavingRes(true);
        try {
            if (resEditing) {
                const payload: EditResourcePayload = { type: resForm.type, details: resForm.details };
                await resourceService.editResource(resEditing.id, payload);
                toast.success("Resource request updated");
            } else {
                await resourceService.createResourceRequest(resForm);
                toast.success("Resource request submitted");
            }
            setResDialogOpen(false);
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to save resource request");
        } finally {
            setIsSavingRes(false);
        }
    };

    /* ── Delete Handler ── */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (deleteTarget.type === "task") {
                await taskService.deleteTask(deleteTarget.id);
                toast.success("Task deleted");
            } else {
                await resourceService.deleteResourceRequest(deleteTarget.id);
                toast.success("Resource request deleted");
            }
            setDeleteTarget(null);
            fetchAll();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    /* ── Utility ── */
    const getMemberName = (userId: number) => {
        const m = members.find(m => m.user_id === userId || m.user?.id === userId);
        return m?.user?.full_name || `User #${userId}`;
    };

    /* ── Loading ── */
    if (isLoading) {
        return (
            <div className="py-24 flex flex-col items-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                <p className="text-sm">Loading project details...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="py-24 text-center space-y-4">
                <p className="text-muted-foreground">Project not found.</p>
                <Button variant="outline" onClick={() => router.push("/pm/projects")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
                </Button>
            </div>
        );
    }

    const tasksTodo = tasks.filter(t => t.status === "todo").length;
    const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
    const tasksDone = tasks.filter(t => t.status === "done").length;

    return (
        <div className="space-y-6 pb-10">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-2.5 shrink-0 hover:bg-slate-200 rounded-full transition-colors" onClick={() => router.push("/pm/projects")}>
                        <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </Button>
                    <div className="min-w-0 flex flex-col pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-0.5">Project Detail</span>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 truncate tracking-tight">{project.name}</h1>
                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", projectStatusColors[project.status] || "bg-slate-100 text-slate-600")}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", projectStatusDotColors[project.status] || "bg-slate-400")} />
                                <span className="uppercase">{project.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs Content ── */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-100 p-1 mb-6 rounded-xl flex self-start overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                    <TabsTrigger value="team" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Team Members</TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Tasks</TabsTrigger>
                    <TabsTrigger value="resources" className="rounded-lg text-sm px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Resources</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 mt-0 focus:outline-none">
                    <div className="mb-2">
                        <h2 className="text-base font-semibold text-slate-900">Project Overview</h2>
                        <p className="text-xs text-slate-500 mt-1">Summary of key metrics and overall status of this project.</p>
                    </div>

                    {/* Task Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: "Pending (To Do)", value: tasksTodo, color: "text-slate-900", iconBg: "bg-slate-100 text-slate-600" },
                            { label: "Active (In Progress)", value: tasksInProgress, color: "text-slate-900", iconBg: "bg-blue-50 text-blue-600" },
                            { label: "Completed (Done)", value: tasksDone, color: "text-slate-900", iconBg: "bg-emerald-50 text-emerald-600" },
                        ].map((item, i) => (
                            <Card key={i} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", item.iconBg)}>
                                        <ListTodo className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">{item.label}</p>
                                        <p className={cn("text-2xl font-black tracking-tight", item.color)}>
                                            {item.value} <span className="text-sm font-medium text-slate-500 tracking-normal ml-0.5">Tasks</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Project Information */}
                    <Card className="border-slate-200 shadow-sm rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-5 uppercase tracking-wider">Project Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1.5 border-l-2 border-slate-100 pl-4">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Client Name</span>
                                    <span className="font-semibold text-slate-900 text-base block">{project.client_name || "-"}</span>
                                </div>
                                <div className="space-y-1.5 border-l-2 border-slate-100 pl-4">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Client Email</span>
                                    <span className="font-semibold text-slate-900 text-base block">{project.client_email || "-"}</span>
                                </div>
                                <div className="space-y-1.5 border-l-2 border-slate-100 pl-4">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Assigned PM</span>
                                    <span className="font-semibold text-slate-900 text-base block">{members.find(m => m.role_in_project === "Project Manager")?.user?.full_name || "Not Assigned"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TEAM TAB */}
                <TabsContent value="team" className="space-y-4 mt-0 focus:outline-none">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-slate-900">Project Members</h2>
                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{members.length}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">List of assigned team members along with their roles.</p>
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <Users className="h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-600">No members assigned.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {members.map(m => (
                                <div key={m.id} className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                            {(m.user?.full_name || "?").split(" ").slice(0, 2).map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-slate-900 truncate block group-hover:text-blue-700 transition-colors">{m.user?.full_name || `User #${m.user_id}`}</span>
                                        <span className="text-[11px] text-slate-500 truncate block mt-0.5">{m.user?.email || "-"}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-medium bg-slate-100 shrink-0 uppercase tracking-widest text-slate-500">{m.role_in_project}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="space-y-4 mt-0 focus:outline-none">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-semibold text-slate-900">Task List</h2>
                            <p className="text-xs text-slate-500 mt-0.5">List of all active, pending, and completed tasks for this project.</p>
                        </div>
                        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-9 px-4 shrink-0 mt-1" onClick={openCreateTask}>
                            <Plus className="h-4 w-4" /> Add Task
                        </Button>
                    </div>
                    {tasks.length === 0 ? (
                        <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <ListTodo className="h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-600">No tasks yet</p>
                                <p className="text-xs text-slate-400 mt-1">Create a task to start tracking progress.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-slate-50">
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-12 text-center">No</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Task Details</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Assignee</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-center">Status</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.map((t, index) => (
                                            <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50/50">
                                                <TableCell className="py-3 text-sm text-slate-500 font-medium text-center">{index + 1}</TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-semibold text-sm text-slate-900">{t.title}</div>
                                                    {t.description && <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-md">{t.description}</div>}
                                                </TableCell>
                                                <TableCell className="py-3 text-sm text-slate-600 font-medium">
                                                    {getMemberName(t.assigned_to_id)}
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", taskStatusColors[t.status])}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", taskStatusDotColors[t.status])} />
                                                        <span className="uppercase">{t.status.replace("_", " ")}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 font-medium text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-lg">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                                                            <DropdownMenuItem onClick={() => openEditTask(t)} className="text-xs font-medium cursor-pointer">
                                                                <Pencil className="mr-2 h-3.5 w-3.5 text-blue-500" /> Edit Task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeleteTarget({ type: "task", id: t.id, title: t.title })} className="text-xs font-medium cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Task
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* RESOURCES TAB */}
                <TabsContent value="resources" className="space-y-4 mt-0 focus:outline-none">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-semibold text-slate-900">Project Resources</h2>
                            <p className="text-xs text-slate-500 mt-0.5">List of all resource requests and operational requirements for this project.</p>
                        </div>
                        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-9 px-4 shrink-0 mt-1" onClick={openCreateRes}>
                            <Plus className="h-4 w-4" /> Request Resource
                        </Button>
                    </div>
                    {resources.length === 0 ? (
                        <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <Package className="h-10 w-10 text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-600">No resource requests</p>
                                <p className="text-xs text-slate-400 mt-1">Submit requests for manpower or tools.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-slate-50">
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-12 text-center">No</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 w-12 text-center">Type</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11">Details</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-center">Status</TableHead>
                                            <TableHead className="font-bold text-[11px] uppercase tracking-widest text-slate-500 h-11 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resources.map((r, index) => (
                                            <TableRow key={r.id} className="border-slate-100 hover:bg-slate-50/50">
                                                <TableCell className="py-3 text-sm text-slate-500 font-medium text-center">{index + 1}</TableCell>
                                                <TableCell className="py-3">
                                                    <div className="h-8 w-8 mx-auto rounded-lg bg-slate-100 flex items-center justify-center">
                                                        {typeIcons[r.type] || <Package className="h-4 w-4 text-slate-400" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-medium text-sm text-slate-900">{r.details}</div>
                                                    <Badge variant="outline" className="mt-1 text-[9px] uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200">{r.type}</Badge>
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", resStatusColors[r.status])}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", resStatusDotColors[r.status])} />
                                                        <span className="uppercase">{r.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 font-medium text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-lg">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                                                            <DropdownMenuItem onClick={() => openEditRes(r)} className="text-xs font-medium cursor-pointer">
                                                                <Pencil className="mr-2 h-3.5 w-3.5 text-blue-500" /> Edit Request
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeleteTarget({ type: "resource", id: r.id, title: r.details })} className="text-xs font-medium cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Request
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* ════ DIALOGS ════ */}

            {/* Task Create / Edit Dialog */}
            <Dialog open={taskDialogOpen} onOpenChange={open => !isSavingTask && setTaskDialogOpen(open)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg text-[#0f172a]">{taskEditing ? "Edit Task" : "New Task"}</DialogTitle>
                        <DialogDescription className="text-xs">{taskEditing ? `Editing "${taskEditing.title}"` : "Create a new task for this project"}</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                            <Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" disabled={isSavingTask} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea value={taskForm.description || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Describe the task..." className="resize-none" rows={3} disabled={isSavingTask} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Assign To</label>
                                <Select value={String(taskForm.assigned_to_id || "")} onValueChange={v => setTaskForm({ ...taskForm, assigned_to_id: Number(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => (
                                            <SelectItem key={m.user_id} value={String(m.user_id)}>{m.user?.full_name || `User #${m.user_id}`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {taskEditing && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select value={taskForm.status || "todo"} onValueChange={v => setTaskForm({ ...taskForm, status: v })}>
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
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setTaskDialogOpen(false)} disabled={isSavingTask}>Cancel</Button>
                        <Button onClick={handleSaveTask} disabled={isSavingTask} className="bg-blue-600 hover:bg-blue-700 min-w-[110px] rounded-lg">
                            {isSavingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : taskEditing ? "Save Changes" : "Create Task"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resource Create / Edit Dialog */}
            <Dialog open={resDialogOpen} onOpenChange={open => !isSavingRes && setResDialogOpen(open)}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg text-[#0f172a]">{resEditing ? "Edit Request" : "New Resource Request"}</DialogTitle>
                        <DialogDescription className="text-xs">{resEditing ? "Update your resource request" : "Submit a request for resources"}</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Type</label>
                            <Select value={resForm.type} onValueChange={v => setResForm({ ...resForm, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Details <span className="text-red-500">*</span></label>
                            <Textarea value={resForm.details} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResForm({ ...resForm, details: e.target.value })} placeholder="Describe the resource needed..." className="resize-none" rows={3} disabled={isSavingRes} />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setResDialogOpen(false)} disabled={isSavingRes}>Cancel</Button>
                        <Button onClick={handleSaveRes} disabled={isSavingRes} className="bg-blue-600 hover:bg-blue-700 min-w-[110px] rounded-lg">
                            {isSavingRes ? <Loader2 className="h-4 w-4 animate-spin" /> : resEditing ? "Save Changes" : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !isDeleting && !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle>Delete {deleteTarget?.type === "task" ? "Task" : "Resource Request"}</DialogTitle>
                        <DialogDescription className="text-xs mt-1">
                            Are you sure you want to delete &ldquo;<b>{deleteTarget?.title}</b>&rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="min-w-[90px]">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

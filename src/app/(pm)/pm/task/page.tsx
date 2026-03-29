"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ai/ai-components";
import { getPriorityBadgeClasses } from "@/lib/priority-utils";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    Filter,
    Calendar,
    Clock,
    User as UserIcon,
    Briefcase,
    History as HistoryIcon,
    Loader2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { ApiProject, User } from "@/lib/types";
import { taskService, ApiTask, CreateTaskPayload, UpdateTaskPayload } from "@/lib/services/task-service";
import { projectService } from "@/lib/services/project-service";
import { adminUserService } from "@/lib/services/admin-users";
import { cn } from "@/lib/utils";

export default function TasksPage() {
    // API Data States
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination State
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [filterProject, setFilterProject] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Dialog/Sheet States
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);

    // Form State
    const [form, setForm] = useState<CreateTaskPayload & { status?: any }>({
        title: "",
        project_id: 0,
        assigned_to_id: 0,
        description: "",
        status: "todo"
    });

    // Fetch Initial Data
    const fetchData = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        try {
            // Load projects for lookup (PM has access to /getproject)
            const projRes = await projectService.getProjects(1, 100);
            setProjects(projRes.data || []);

            let allTasks: ApiTask[] = [];
            let allUsers: any[] = [];

            if (filterProject !== "all") {
                // Fetch tasks and members for the specific project
                const [taskRes, memberRes] = await Promise.all([
                    taskService.getProjectTasks(filterProject),
                    projectService.getProjectMembers(Number(filterProject))
                ]);

                allTasks = Array.isArray(taskRes) ? taskRes : [];
                // Map project members to simple user objects for the UI
                allUsers = Array.isArray(memberRes) ? memberRes.map(m => m.user).filter(Boolean) : [];
            } else if (projRes.data && projRes.data.length > 0) {
                // Fetch from first project as fallback for "All" view to show some data
                const firstProjId = projRes.data[0].id;
                const [taskRes, memberRes] = await Promise.all([
                    taskService.getProjectTasks(firstProjId),
                    projectService.getProjectMembers(firstProjId)
                ]);
                allTasks = Array.isArray(taskRes) ? taskRes : [];
                allUsers = Array.isArray(memberRes) ? memberRes.map(m => m.user).filter(Boolean) : [];
            }

            setTasks(allTasks);
            setUsers(allUsers);
            setPagination(prev => ({ ...prev, page, total: allTasks.length }));
        } catch (error: any) {
            console.error("Fetch Error:", error);
            toast.error(error.message || "Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    }, [filterProject]);

    // Handle fetching members when a project is selected in the New Task dialog
    const handleProjectChange = async (projectId: string) => {
        setForm({ ...form, project_id: Number(projectId), assigned_to_id: 0 });
        if (!projectId) return;

        try {
            const memberRes = await projectService.getProjectMembers(Number(projectId));
            const projectUsers = Array.isArray(memberRes) ? memberRes.map(m => m.user).filter(Boolean) : [];
            setUsers(projectUsers);
        } catch (error: any) {
            toast.error("Failed to load project members");
        }
    };

    // Effect to fetch data on mount and filter change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveTask = async () => {
        if (!form.title || !form.project_id || !form.assigned_to_id) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && selectedTask) {
                const updatePayload: UpdateTaskPayload = {
                    title: form.title,
                    description: form.description,
                    assigned_to_id: form.assigned_to_id,
                    status: form.status
                };
                await taskService.updateTask(selectedTask.id, updatePayload);
                toast.success("Task updated successfully");
                setIsEditMode(false);
            } else {
                const createPayload: CreateTaskPayload = {
                    title: form.title,
                    project_id: form.project_id,
                    assigned_to_id: form.assigned_to_id,
                    description: form.description
                };
                await taskService.createTask(createPayload);
                toast.success("New task assigned successfully");
                setIsNewTaskOpen(false);
            }
            fetchData(pagination.page);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to save task");
        } finally {
            setIsSaving(false);
        }
    };

    const executeDelete = async () => {
        if (!selectedTask) return;
        setIsSaving(true);
        try {
            await taskService.deleteTask(selectedTask.id);
            toast.success("Task deleted successfully");
            setIsDeleteOpen(false);
            setIsDetailOpen(false);
            setSelectedTask(null);
            fetchData(pagination.page);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete task");
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: "",
            project_id: 0,
            assigned_to_id: 0,
            description: "",
            status: "todo"
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            todo: "bg-slate-50 text-slate-600 border-slate-200",
            in_progress: "bg-blue-50 text-blue-700 border-blue-100",
            done: "bg-emerald-50 text-emerald-700 border-emerald-100",
        };
        const dotColors: Record<string, string> = {
            todo: "bg-slate-400",
            in_progress: "bg-blue-500",
            done: "bg-emerald-500",
        };
        return (
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border", variants[status])}>
                <div className={cn("w-1.5 h-1.5 rounded-full", dotColors[status])} />
                <span className="uppercase">{status.replace("_", " ")}</span>
            </div>
        );
    };

    const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || `Project #${id}`;
    const getUserName = (id: number) => users.find(u => String(u.id) === String(id))?.full_name || `User #${id}`;

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    // Filtered + paginated tasks
    const filteredTasks = useMemo(() => {
        let result = tasks;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                getUserName(t.assigned_to_id).toLowerCase().includes(q)
            );
        }
        if (filterStatus !== "all") {
            result = result.filter(t => t.status === filterStatus);
        }
        const start = (pagination.page - 1) * pagination.limit;
        return result.slice(start, start + pagination.limit);
    }, [tasks, searchQuery, filterStatus, pagination.page, pagination.limit]);

    // Open task detail sheet
    const handleOpenDetail = (task: ApiTask) => {
        setSelectedTask(task);
        setIsEditMode(false);
        setIsDetailOpen(true);
    };

    // Switch detail sheet to edit mode
    const handleOpenEdit = () => {
        if (!selectedTask) return;
        setForm({
            title: selectedTask.title,
            project_id: selectedTask.project_id,
            assigned_to_id: selectedTask.assigned_to_id,
            description: selectedTask.description || "",
            status: selectedTask.status
        });
        setIsEditMode(true);
    };

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Tasks" description={`Monitoring ${pagination.total} total assignments`}>
                <Button size="sm" className="gap-2 bg-[#2568C1] hover:bg-[#1a4f99] text-white shadow-sm" onClick={() => {
                    setForm({
                        title: "",
                        project_id: 0,
                        assigned_to_id: 0,
                        description: "",
                        status: "todo"
                    });
                    setIsNewTaskOpen(true);
                }}>
                    <Plus className="h-4 w-4" /> New Task
                </Button>
            </PageHeader>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks or assignee..."
                            className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-[#2568C1]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="h-10 w-[180px] bg-white border-slate-200">
                            <Briefcase className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 w-[150px] bg-white border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tasks Table */}
            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-slate-100">
                                    <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                    <TableHead className="w-[200px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Assignee</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Task Details</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[100px] pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                                <p className="text-sm">Fetching real-time task data...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No tasks found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTasks.map((task, index) => (
                                        <TableRow key={task.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                            <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-slate-200">
                                                        <AvatarFallback className="bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-[10px] text-white font-bold">
                                                            {getUserName(task.assigned_to_id).split(" ").map((n: string) => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium text-slate-700">{getUserName(task.assigned_to_id)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium text-[11px]">
                                                    {getProjectName(task.project_id)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col max-w-[300px]">
                                                    <span className="text-sm font-semibold text-slate-900 truncate">{task.title}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate opacity-70">{task.description || "No description"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full"
                                                    onClick={() => handleOpenDetail(task)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {!isLoading && totalPages > 1 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> tasks
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <div className="text-xs font-medium px-2">Page {pagination.page} of {totalPages}</div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= totalPages} onClick={() => fetchData(pagination.page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Task Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto bg-white p-0 border-l border-slate-200">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-6">
                        <div className="flex items-center justify-between mb-4">
                            {selectedTask && getStatusBadge(selectedTask.status)}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={handleOpenEdit}>
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-red-600 border-red-100 hover:bg-red-50" onClick={() => setIsDeleteOpen(true)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                            </div>
                        </div>
                        <SheetHeader className="text-left">
                            <SheetTitle className="text-xl font-bold text-slate-900 leading-tight">
                                {isEditMode ? "Update Task Parameters" : selectedTask?.title}
                            </SheetTitle>
                            <SheetDescription className="text-slate-500">
                                {isEditMode ? "Modifying existing assignment details." : `Created on ${selectedTask?.created_at ? new Date(selectedTask.created_at).toLocaleDateString('id-ID') : '-'}`}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="p-6">
                        {isEditMode ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Project <span className="text-red-500">*</span></label>
                                        <Select value={String(form.project_id)} onValueChange={(v) => setForm({ ...form, project_id: Number(v) })}>
                                            <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]">
                                                <SelectValue placeholder="Select project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assign To <span className="text-red-500">*</span></label>
                                        <Select value={String(form.assigned_to_id)} onValueChange={(v) => setForm({ ...form, assigned_to_id: Number(v) })}>
                                            <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]">
                                                <SelectValue placeholder="Select team member" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Title <span className="text-red-500">*</span></label>
                                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                                        <textarea
                                            className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2568C1]/20 text-sm"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Status</label>
                                        <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                                            <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todo">Todo</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <Button className="flex-1 bg-[#2568C1] hover:bg-[#1a4f99]" onClick={handleSaveTask} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => setIsEditMode(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <UserIcon className="h-3 w-3" /> Assignee
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{getUserName(selectedTask?.assigned_to_id || 0)}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <Briefcase className="h-3 w-3" /> Project
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{getProjectName(selectedTask?.project_id || 0)}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> Last Update
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedTask?.updated_at ? new Date(selectedTask.updated_at).toLocaleDateString('id-ID') : '-'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Task ID
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">#{selectedTask?.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <Filter className="h-3 w-3" /> Task Description
                                    </p>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed shadow-inner">
                                        {selectedTask?.description || "No detailed description provided for this task."}
                                    </div>
                                </div>

                                {/* Placeholder for Timesheet Logs Integration */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <HistoryIcon className="h-3 w-3" /> Related Timesheets
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                                        <div className="p-8 text-center text-xs text-muted-foreground italic bg-slate-50/30">
                                            Timesheet history for this task is aggregated from project logs.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* New Task Dialog */}
            <Dialog open={isNewTaskOpen} onOpenChange={(open) => !isSaving && setIsNewTaskOpen(open)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-[#f8fafc] border-b border-slate-200 px-6 py-5">
                        <DialogTitle className="text-xl font-bold text-slate-900">Assign New Task</DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm">
                            Configure task details and assign it to an employee.
                        </DialogDescription>
                    </div>
                    <div className="px-6 py-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2568C1] text-[10px] text-white">1</span>
                                Select Project <span className="text-red-500">*</span>
                            </label>
                            <Select value={String(form.project_id)} onValueChange={(v) => { resetForm(); setForm({ ...form, project_id: Number(v) }); }}>
                                <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]">
                                    <SelectValue placeholder="Choose a project..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={cn("space-y-1.5 transition-all duration-300", !form.project_id ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2568C1] text-[10px] text-white">2</span>
                                Assign Employee <span className="text-red-500">*</span>
                            </label>
                            <Select value={String(form.assigned_to_id)} onValueChange={(v) => setForm({ ...form, assigned_to_id: Number(v) })}>
                                <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]">
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={cn("space-y-4 transition-all duration-300", !form.assigned_to_id ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2568C1] text-[10px] text-white">3</span>
                                    Task Information <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Brief task title..."
                                    className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]"
                                />
                            </div>
                            <div className="space-y-1.5 ml-7">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2568C1]/20 transition-all"
                                    placeholder="Describe specific task requirements..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-[#f8fafc] border-t border-slate-200 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsNewTaskOpen(false)} className="flex-1 text-slate-500">Cancel</Button>
                        <Button
                            onClick={handleSaveTask}
                            disabled={!form.title || !form.project_id || !form.assigned_to_id || isSaving}
                            className="flex-1 bg-[#2568C1] hover:bg-[#1a4f99] shadow-md"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => !isSaving && setIsDeleteOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-lg">Delete this task?</DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            You are about to permanently remove <b className="text-slate-900">"{selectedTask?.title}"</b>. This action will also disconnect any progress associated with this specific task ID.
                        </DialogDescription>
                        <div className="flex gap-3 w-full mt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)} disabled={isSaving}>No, Keep it</Button>
                            <Button variant="destructive" className="flex-1" onClick={executeDelete} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Task"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

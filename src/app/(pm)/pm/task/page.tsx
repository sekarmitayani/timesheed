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
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { cn } from "@/lib/utils";

export default function TasksPage() {
    // API Data States
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Timesheet States
    const [taskTimesheets, setTaskTimesheets] = useState<TimesheetLog[]>([]);
    const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(false);

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
            const allProjects = projRes.data || [];
            setProjects(allProjects);

            let allTasks: ApiTask[] = [];
            let allUsers: any[] = [];

            if (filterProject !== "all") {
                // Fetch tasks and members for the specific project
                const [taskRes, memberRes] = await Promise.all([
                    taskService.getProjectTasks(filterProject),
                    projectService.getProjectMembers(Number(filterProject))
                ]);

                allTasks = Array.isArray(taskRes) ? taskRes : [];
                allUsers = Array.isArray(memberRes) ? memberRes.map(m => m.user).filter(Boolean) : [];
            } else if (allProjects.length > 0) {
                // Fetch tasks and members from ALL projects assigned to the PM
                const taskPromises = allProjects.map(p => taskService.getProjectTasks(p.id));
                const memberPromises = allProjects.map(p => projectService.getProjectMembers(p.id));
                
                const [taskResults, memberResults] = await Promise.all([
                    Promise.all(taskPromises),
                    Promise.all(memberPromises)
                ]);

                // Flatten and deduplicate
                allTasks = taskResults.flat();
                
                // Use a Map for deduplication of users by ID
                const userMap = new Map();
                memberResults.flat().forEach(m => {
                    if (m && m.user) {
                        userMap.set(m.user.id, m.user);
                    }
                });
                allUsers = Array.from(userMap.values());
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
            const members = Array.isArray(memberRes) ? memberRes.map(m => m.user).filter(Boolean) : [];
            setProjectMembers(members);
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
                setIsDetailOpen(false);
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
        setProjectMembers([]);
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
    const getUserContext = (id: number) => users.find(u => String(u.id) === String(id));
    const getUserName = (id: number) => getUserContext(id)?.full_name || getUserContext(id)?.name || `User #${id}`;

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    // Filtered + paginated tasks
    const filteredTasks = useMemo(() => {
        let result = [...tasks].sort((a, b) => b.id - a.id);
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
    const handleOpenDetail = async (task: ApiTask) => {
        setSelectedTask(task);
        setIsEditMode(false);
        setIsDetailOpen(true);

        // Fetch timesheets
        setIsLoadingTimesheets(true);
        try {
            const res = await timesheetService.getTaskTimesheets(task.id);
            setTaskTimesheets(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error("Failed to fetch task timesheets", error);
            setTaskTimesheets([]);
        } finally {
            setIsLoadingTimesheets(false);
        }
    };

    // Switch detail sheet to edit mode
    const handleOpenEdit = async () => {
        if (!selectedTask) return;
        setForm({
            title: selectedTask.title,
            project_id: selectedTask.project_id,
            assigned_to_id: selectedTask.assigned_to_id,
            description: selectedTask.description || "",
            status: selectedTask.status
        });

        // Load project members for the dropdown
        try {
            const memberRes = await projectService.getProjectMembers(selectedTask.project_id);
            const members = Array.isArray(memberRes) ? memberRes.map(m => m.user).filter(Boolean) : [];
            setProjectMembers(members);
        } catch (error) {
            console.error("Failed to load members for edit", error);
        }
        
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
                    resetForm();
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
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Task</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                                    <TableHead className="w-[180px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Assignee</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[80px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 text-left">Actions</TableHead>
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
                                            <TableCell className="max-w-[200px] sm:max-w-[300px]">
                                                <div className="flex flex-col py-1">
                                                    <span className="text-sm font-semibold text-slate-900 truncate" title={task.title}>{task.title}</span>
                                                    <span className="text-[10px] text-muted-foreground opacity-70 break-words line-clamp-2 mt-0.5">{task.description || "No description"}</span>
                                                    {task.description && task.description.length > 60 && (
                                                        <button 
                                                            onClick={() => handleOpenDetail(task)}
                                                            className="text-[10px] text-[#2568C1] font-medium text-left mt-0.5 hover:underline"
                                                        >
                                                            View Full
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-slate-600">
                                                    {getProjectName(task.project_id)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Avatar className="h-7 w-7 border border-slate-200 shrink-0">
                                                        <AvatarFallback className="bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-[9px] text-white font-bold">
                                                            {getUserName(task.assigned_to_id).split(" ").map((n: string) => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium text-slate-700 truncate">{getUserName(task.assigned_to_id)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                                            <TableCell className="text-left">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full"
                                                        onClick={() => handleOpenDetail(task)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full"
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {pagination.total > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> tasks
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">Page {pagination.page} of {totalPages || 1}</div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= totalPages} onClick={() => fetchData(pagination.page + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Task Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto bg-white p-0 border-l border-slate-200">
                    {/* Header with better padding to avoid close button collision */}
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-8 py-8 pr-16 relative">
                        <div className="flex items-center justify-between mb-5">
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
                            <SheetTitle className="text-2xl font-bold text-slate-900 leading-tight break-words whitespace-normal">
                                {isEditMode ? "Update Task Parameters" : selectedTask?.title}
                            </SheetTitle>
                            <SheetDescription className="text-slate-500 font-medium break-words">
                                {isEditMode ? "Modifying existing assignment details." : `ID #${selectedTask?.id} • Created ${selectedTask?.created_at ? new Date(selectedTask.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}`}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="p-8">
                        {isEditMode ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Project <span className="text-red-500">*</span></label>
                                        <Select value={String(form.project_id)} onValueChange={(v) => handleProjectChange(v)}>
                                            <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-[#2568C1]">
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
                                            <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-[#2568C1]">
                                                <SelectValue placeholder="Select team member" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projectMembers.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Title <span className="text-red-500">*</span></label>
                                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 bg-white border-slate-200 focus:ring-[#2568C1]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                                        <textarea
                                            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2568C1]/20 text-sm leading-relaxed"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Status</label>
                                        <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                                            <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-[#2568C1]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todo">Todo</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100">
                                    <Button className="flex-1 bg-[#2568C1] hover:bg-[#1a4f99] h-11" onClick={handleSaveTask} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-11" onClick={() => setIsEditMode(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <UserIcon className="h-3.5 w-3.5" /> Assignee
                                        </p>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-sm font-bold text-slate-800 break-words">{getUserName(selectedTask?.assigned_to_id || 0)}</p>
                                            <p className="text-[11px] text-[#2568C1] font-medium break-all">{getUserContext(selectedTask?.assigned_to_id || 0)?.email || "No email record"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Briefcase className="h-3.5 w-3.5" /> Project
                                        </p>
                                        <p className="text-sm font-bold text-slate-800 break-words">{getProjectName(selectedTask?.project_id || 0)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" /> Last Update
                                        </p>
                                        <p className="text-sm font-bold text-slate-800">
                                            {selectedTask?.updated_at 
                                                ? new Date(selectedTask.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                                                : '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <HistoryIcon className="h-3.5 w-3.5" /> Assignment Status
                                        </p>
                                        <div className="pt-0.5">{selectedTask && getStatusBadge(selectedTask.status)}</div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-8 border-t border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5" /> Task Description
                                    </p>
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed shadow-inner break-words">
                                        {selectedTask?.description || "No detailed description provided for this assignment."}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5" /> Timesheet Logs
                                    </p>
                                    
                                    {isLoadingTimesheets ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-[#2568C1]" />
                                        </div>
                                    ) : taskTimesheets.length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 font-medium">No timesheet records found for this task.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {taskTimesheets.map((log) => (
                                                <div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col gap-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {new Date(log.clock_in).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-100">
                                                            {formatDuration(log.duration_minutes)}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] uppercase font-bold text-slate-400">Clock In</p>
                                                            <p className="text-xs font-medium text-slate-600">
                                                                {new Date(log.clock_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] uppercase font-bold text-slate-400">Clock Out</p>
                                                            <p className="text-xs font-medium text-slate-600">
                                                                {log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* New Task Dialog */}
            <Dialog open={isNewTaskOpen} onOpenChange={(open) => !isSaving && setIsNewTaskOpen(open)}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-xl text-[#0f172a]">Assign New Task</DialogTitle>
                        <DialogDescription className="text-sm">
                            Configure task details and assign it to an employee.
                        </DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Select Project <span className="text-red-500">*</span></label>
                            <Select value={form.project_id ? String(form.project_id) : ""} onValueChange={(v) => handleProjectChange(v)}>
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
                            <label className="text-sm font-medium">Assign Employee <span className="text-red-500">*</span></label>
                            <Select value={String(form.assigned_to_id)} onValueChange={(v) => setForm({ ...form, assigned_to_id: Number(v) })}>
                                <SelectTrigger className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]">
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectMembers.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={cn("space-y-4 transition-all duration-300", !form.assigned_to_id ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Task Information <span className="text-red-500">*</span></label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Brief task title..."
                                    className="h-10 bg-white border-slate-200 focus:ring-[#2568C1]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-lg border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2568C1]/20 transition-all"
                                    placeholder="Describe specific task requirements..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsNewTaskOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button
                            onClick={handleSaveTask}
                            disabled={!form.title || !form.project_id || !form.assigned_to_id || isSaving}
                            className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] shadow-sm"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => !isSaving && setIsDeleteOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center gap-4 py-4 px-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-lg">Delete this task?</DialogTitle>
                        <DialogDescription className="text-center text-slate-500 w-full overflow-hidden">
                            You are about to permanently remove <span className="block text-slate-900 font-bold truncate mx-auto max-w-[280px] sm:max-w-[350px] mt-1" title={selectedTask?.title}>"{selectedTask?.title}"</span> This action will also disconnect any progress associated with this specific task ID.
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

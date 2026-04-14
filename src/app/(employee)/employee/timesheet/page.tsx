"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    PlayCircle, 
    StopCircle, 
    Loader2, 
    Clock, 
    FileText, 
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    UserCircle,
    Briefcase,
    Filter,
    Calendar,
    Search,
    RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { ApiProject } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    pending: { 
        bg: "bg-amber-50", 
        text: "text-amber-700", 
        icon: Clock, 
        label: "Pending" 
    },
    approved: { 
        bg: "bg-emerald-50", 
        text: "text-emerald-700", 
        icon: CheckCircle2, 
        label: "Approved" 
    },
    rejected: { 
        bg: "bg-red-50", 
        text: "text-red-700", 
        icon: XCircle, 
        label: "Rejected" 
    },
};

export default function TimesheetPage() {
    const [logs, setLogs] = useState<TimesheetLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveSession, setHasActiveSession] = useState(false);
    const [taskMap, setTaskMap] = useState<Record<number, ApiTask>>({});
    const [userMap, setUserMap] = useState<Record<number, string>>({});

    // Filter State - Top Bar (Time)
    const [filterType, setFilterType] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    // Filter State - Table Bar (Project & Status)
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const LIMIT = 10;

    // Clock In/Out Dialogs
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [isClocking, setIsClocking] = useState(false);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [clockOutDesc, setClockOutDesc] = useState("");

    // Detail Modal
    const [selectedLog, setSelectedLog] = useState<TimesheetLog | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await timesheetService.getMyLogs();
            const data = Array.isArray(res) ? res : [];
            setLogs(data.sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime()));
            setHasActiveSession(data.some(l => l.clock_in && !l.clock_out));
            
            // Fetch unique task objects and users
            const projectIds = Array.from(new Set(data.map(l => l.project_id)));
            
            const newTaskMap: Record<number, ApiTask> = {};
            const newUserMap: Record<number, string> = {};

            // Pre-fill userMap with self from logs
            data.forEach(l => {
                if (l.user) newUserMap[l.user_id] = l.user.full_name;
            });
            
            for (const pid of projectIds) {
                try {
                    const pTasks = await taskService.getProjectTasks(pid);
                    pTasks.forEach(t => { newTaskMap[t.id] = t; });

                    const pMembers = await projectService.getProjectMembers(pid);
                    pMembers.forEach(m => { 
                        if (m.user) newUserMap[m.user_id] = m.user.full_name; 
                    });
                } catch { /* skip */ }
            }
            setTaskMap(newTaskMap);
            setUserMap(newUserMap);

        } catch (e: any) {
            toast.error(e.message || "Failed to load timesheet logs");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await projectService.getProjects(1, 100);
            setProjects(res.data || []);
        } catch { /* skip */ }
    };

    useEffect(() => { 
        fetchLogs(); 
        fetchProjects();
    }, []);

    const filteredLogs = useMemo(() => {
        let result = [...logs];

        // 1. Time Filters
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (filterType === "daily") {
            result = result.filter(log => {
                const logDate = new Date(log.clock_in);
                return logDate.toDateString() === today.toDateString();
            });
        } else if (filterType === "weekly") {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            result = result.filter(log => new Date(log.clock_in) >= weekAgo);
        } else if (filterType === "monthly") {
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            result = result.filter(log => new Date(log.clock_in) >= monthAgo);
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter(log => new Date(log.clock_in) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(log => new Date(log.clock_in) <= to);
        }

        // 2. Project Filter
        if (filterProject !== "all") {
            result = result.filter(log => log.project_id === Number(filterProject));
        }

        // 3. Status Filter
        if (filterStatus !== "all") {
            result = result.filter(log => log.status === filterStatus);
        }

        return result;
    }, [logs, filterType, dateFrom, dateTo, filterProject, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, dateFrom, dateTo, filterProject, filterStatus]);

    const paginatedLogs = useMemo(() => {
        return filteredLogs.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / LIMIT);

    const dailySummary = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            
            const dayLogs = logs.filter(l => l.clock_in.startsWith(dateStr));
            const totalMinutes = dayLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
            
            days.push({
                date: d,
                label: d.toLocaleDateString("en-US", { weekday: "short" }),
                dateDisplay: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
                minutes: totalMinutes,
                hours: (totalMinutes / 60).toFixed(1),
                isToday: i === 0
            });
        }
        return days;
    }, [logs]);

    const handleClockOut = async () => {
        if (!clockOutDesc.trim()) { toast.error("Description is required"); return; }
        setIsClocking(true);
        try {
            const res = await timesheetService.clockOut({ task_description: clockOutDesc });
            toast.success(res.message || "Clock Out successful!");
            setClockOutOpen(false);
            setClockOutDesc("");
            fetchLogs();
        } catch (e: any) {
            toast.error(e.message || "Clock Out failed");
        } finally {
            setIsClocking(false);
        }
    };

    const resetFilters = () => {
        setFilterType("all");
        setDateFrom("");
        setDateTo("");
        setFilterProject("all");
        setFilterStatus("all");
    };

    const activeLog = logs.find(l => l.clock_in && !l.clock_out);

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    const formatTime24 = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleTimeString("en-GB", { 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: false 
        });
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + " • " + formatTime24(dateStr);
    };

    const getTaskTitle = (taskId: number | null) => {
        if (!taskId) return "General Productivity";
        return taskMap[taskId]?.title || `Task #${taskId}`;
    };

    return (
        <div className="flex flex-col w-full gap-4 h-full overflow-hidden">
            <PageHeader title="Timesheet Management" description="Monitor and track your work sessions and daily productivity.">
                <div className="flex gap-2">
                    {hasActiveSession && (
                        <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 shadow-sm border-none rounded-[4px]" onClick={() => setClockOutOpen(true)}>
                            <StopCircle className="h-4 w-4" /> Clock Out
                        </Button>
                    )}
                </div>
            </PageHeader>

            {/* TOP FILTERS (Time Range) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 p-2 border border-[#E2E8F0] rounded-[6px] shrink-0">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#4B7BEC]" />
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[140px] h-8 text-xs border-none bg-transparent shadow-none focus:ring-0 font-bold">
                                <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="daily">Daily View</SelectItem>
                                <SelectItem value="weekly">Weekly View</SelectItem>
                                <SelectItem value="monthly">Monthly View</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Range:</span>
                        <div className="flex flex-wrap items-center gap-1">
                            <Input 
                                type="date" 
                                className="h-8 w-[145px] text-[11px] border-[#E2E8F0] rounded-[4px] bg-white shadow-none px-2" 
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <span className="text-muted-foreground text-[10px] mx-1">to</span>
                            <Input 
                                type="date" 
                                className="h-8 w-[145px] text-[11px] border-[#E2E8F0] rounded-[4px] bg-white shadow-none px-2" 
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {(filterType !== "all" || dateFrom || dateTo || filterProject !== "all" || filterStatus !== "all") && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters}
                        className="text-[10px] text-[#4B7BEC] font-bold uppercase hover:bg-[#4B7BEC]/5 h-8 px-3 gap-1.5"
                    >
                        <RefreshCcw className="h-3 w-3" /> Reset All
                    </Button>
                )}
            </div>

            {/* Summary Header - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 shrink-0">
                {dailySummary.map((day, idx) => {
                    const maxMins = Math.max(...dailySummary.map(d => d.minutes), 480);
                    const barHeight = Math.max(15, (day.minutes / maxMins) * 100);
                    
                    return (
                        <Card key={idx} className={cn(
                            "border-[#E2E8F0] shadow-none rounded-[6px] overflow-hidden transition-all hover:border-[#4B7BEC]/30",
                            day.isToday && "ring-1 ring-[#4B7BEC]/20 border-[#4B7BEC]/20"
                        )}>
                            <CardContent className="p-2 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{day.label}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{day.dateDisplay}</span>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold",
                                        day.isToday ? "text-[#4B7BEC]" : "text-[#0f172a]"
                                    )}>
                                        {day.hours}h
                                    </span>
                                </div>
                                <div className="h-6 flex items-end gap-0.5 bg-slate-50/50 rounded-[2px] p-0.5">
                                    <div 
                                        className={cn(
                                            "w-full rounded-[1px] transition-all duration-500",
                                            day.minutes >= 480 ? "bg-[#4B7BEC]" : "bg-[#4B7BEC]/30"
                                        )} 
                                        style={{ height: `${barHeight}%` }} 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Active Session Banner */}
            {activeLog && (
                <Card className="border-[#4B7BEC]/20 bg-blue-50/30 rounded-[6px] shadow-none shrink-0">
                    <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4B7BEC]/10 text-[#4B7BEC]">
                            <Clock className="h-4 w-4 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-[#0f172a]">Active Session</p>
                            <p className="text-[10px] text-muted-foreground">
                                In: {formatTime24(activeLog.clock_in)} • 
                                <span className="text-[#4B7BEC] font-bold ml-1">{activeLog.project?.name || `#${activeLog.project_id}`}</span>
                            </p>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-[#4B7BEC]/20 text-[#4B7BEC] hover:bg-[#4B7BEC]/5 rounded-[4px]" onClick={() => setClockOutOpen(true)}>
                            End Session
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
                {/* TABLE FILTERS */}
                <div className="flex flex-wrap items-center gap-3 px-1">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-[180px] h-8 text-[11px] bg-white border-[#E2E8F0] rounded-[4px]">
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[140px] h-8 text-[11px] bg-white border-[#E2E8F0] rounded-[4px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                        <Search className="h-3.5 w-3.5" />
                        Showing {filteredLogs.length} records
                    </div>
                </div>

                <Card className="border-[#E2E8F0] shadow-sm rounded-[6px] overflow-hidden bg-white text-[#0f172a] h-full flex flex-col">
                    <CardContent className="p-0 flex flex-col h-full">
                        <div className="overflow-auto custom-scrollbar flex-1 relative">
                            <Table>
                                <TableHeader className="bg-[#F8FAFC] sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                    <TableRow className="hover:bg-transparent border-[#E2E8F0]">
                                        <TableHead className="w-[140px] text-[10px] font-bold text-muted-foreground uppercase py-3 pl-6 tracking-wider">Date</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Task & Project</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Session Time</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Duration</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase py-3 tracking-wider">Status</TableHead>
                                        <TableHead className="w-[60px] pr-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={6} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] mx-auto opacity-50" /></TableCell></TableRow>
                                    ) : paginatedLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <div className="bg-slate-100 p-4 rounded-full">
                                                        <Search className="h-8 w-8 text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500">No sessions match your filters.</p>
                                                    <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs h-8">Clear All Filters</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedLogs.map(l => (
                                            <TableRow 
                                                key={l.id} 
                                                className="hover:bg-[#F8FAFC] cursor-pointer group border-[#E2E8F0]"
                                                onClick={() => setSelectedLog(l)}
                                            >
                                                <TableCell className="py-3 pl-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-[#0f172a]">{new Date(l.clock_in).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{new Date(l.clock_in).toLocaleDateString("en-US", { weekday: "long" })}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold truncate max-w-[250px] group-hover:text-[#4B7BEC] transition-colors">
                                                            {getTaskTitle(l.task_id)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                            {l.project?.name || `#${l.project_id}`}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                        <span>{formatTime24(l.clock_in)}</span>
                                                        <span className="text-slate-300 font-normal">→</span>
                                                        <span>{formatTime24(l.clock_out)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 font-bold text-xs">
                                                    {l.clock_out ? (
                                                        <span className="text-slate-900">{formatDuration(l.duration_minutes)}</span>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold animate-pulse">LIVE SESSION</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    {l.status && statusConfig[l.status] && (
                                                        <Badge className={cn(
                                                            "px-2 py-0.5 rounded-[4px] border-none text-[9px] font-bold uppercase tracking-tight",
                                                            statusConfig[l.status].bg,
                                                            statusConfig[l.status].text
                                                        )}>
                                                            {statusConfig[l.status].label}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 text-right pr-6">
                                                    <div className="flex justify-end">
                                                        <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white opacity-0 group-hover:opacity-100 transition-all border border-[#E2E8F0] shadow-sm">
                                                            <ChevronRight className="h-3.5 w-3.5 text-[#4B7BEC]" />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    {!isLoading && totalPages > 0 && (
                        <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between shrink-0">
                            <div className="text-xs text-muted-foreground">
                                Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * LIMIT + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * LIMIT, filteredLogs.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredLogs.length}</span> records
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</div>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Timesheet Detail Modal */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent 
                    showCloseButton={false}
                    className="sm:max-w-[500px] p-0 overflow-hidden border-[#E2E8F0] rounded-[8px] gap-0"
                >
                    {selectedLog && (
                        <>
                            <div className="bg-white border-b border-[#F1F5F9] px-6 py-5">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[#4B7BEC] uppercase tracking-widest">Timesheet Detail</p>
                                        <DialogTitle className="text-xl font-bold text-[#0f172a]">
                                            {getTaskTitle(selectedLog.task_id)}
                                        </DialogTitle>
                                    </div>
                                    <Badge className={cn(
                                        "px-2.5 py-1 rounded-[4px] border-none text-[10px] font-bold uppercase",
                                        statusConfig[selectedLog.status]?.bg,
                                        statusConfig[selectedLog.status]?.text
                                    )}>
                                        {statusConfig[selectedLog.status]?.label}
                                    </Badge>
                                </div>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="p-6 space-y-6">
                                    {/* Info Grid */}
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
                                        <div className="space-y-1 p-3 bg-slate-50 rounded-[6px] border border-slate-100">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Clock In</p>
                                            <p className="text-xs font-bold text-[#0f172a]">{formatDateTime(selectedLog.clock_in)}</p>
                                        </div>
                                        <div className="space-y-1 p-3 bg-slate-50 rounded-[6px] border border-slate-100">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Clock Out</p>
                                            <p className="text-xs font-bold text-[#0f172a]">{formatDateTime(selectedLog.clock_out)}</p>
                                        </div>
                                        <div className="space-y-1 p-3 bg-[#4B7BEC]/5 rounded-[6px] border border-[#4B7BEC]/10">
                                            <p className="text-[10px] font-bold text-[#4B7BEC] uppercase">Duration</p>
                                            {selectedLog.clock_out ? (
                                                <p className="text-sm font-bold text-[#4B7BEC]">{formatDuration(selectedLog.duration_minutes)}</p>
                                            ) : (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold animate-pulse mt-1">LIVE SESSION</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta Information */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 border-y border-[#F1F5F9] py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Project</p>
                                                <p className="text-xs font-semibold text-[#0f172a]">{selectedLog.project?.name || `Project #${selectedLog.project_id}`}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                <UserCircle className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Task Assigner</p>
                                                <p className="text-xs font-semibold text-[#0f172a]">
                                                    {selectedLog.task_id && taskMap[selectedLog.task_id]
                                                        ? (userMap[taskMap[selectedLog.task_id].created_by_id] || "Unknown") 
                                                        : (selectedLog.user?.full_name || "Self")}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedLog.task_id && taskMap[selectedLog.task_id] && (
                                            <div className="flex items-center gap-3 sm:col-span-2">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Task Created On</p>
                                                    <p className="text-xs font-semibold text-[#0f172a]">{formatDateTime(taskMap[selectedLog.task_id].created_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description Section */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Task Logger Note</p>
                                            </div>
                                            <div className="p-4 bg-white border border-[#E2E8F0] rounded-[6px]">
                                                <p className="text-sm text-[#0f172a] leading-relaxed italic">
                                                    "{selectedLog.task_description || "No description provided."}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conditional Rejection Section */}
                                    {selectedLog.status === "rejected" && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-[6px] space-y-2">
                                            <div className="flex items-center gap-2 text-red-700">
                                                <AlertCircle className="h-4 w-4" />
                                                <p className="text-xs font-bold uppercase tracking-wider">Rejection Note</p>
                                            </div>
                                            <p className="text-sm text-red-700 font-medium">
                                                {selectedLog.rejection_note || "Your timesheet log was rejected. Please contact your manager for more details."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC] flex justify-end">
                                <Button 
                                    onClick={() => setSelectedLog(null)} 
                                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[4px] px-8"
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Clock Out Dialog */}
            <Dialog open={clockOutOpen} onOpenChange={open => !isClocking && setClockOutOpen(open)}>
                <DialogContent 
                    showCloseButton={false}
                    className="sm:max-w-[450px] p-0 overflow-hidden border-[#E2E8F0] rounded-[6px] gap-0 shadow-lg"
                >
                    <div className="bg-white px-6 py-5 border-b border-[#F1F5F9]">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.15em]">End Session</p>
                            <DialogTitle className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                                <StopCircle className="h-5 w-5 text-red-600" /> 
                                Clock Out
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-muted-foreground text-xs mt-1.5">
                            Summarize your work accomplishments to complete this session.
                        </DialogDescription>
                    </div>

                    <div className="px-6 py-6 space-y-5 bg-white text-[#0f172a]">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Session Summary</label>
                                <span className="text-[10px] text-red-500 font-bold uppercase">* Required</span>
                            </div>
                            <textarea 
                                value={clockOutDesc} 
                                onChange={e => setClockOutDesc(e.target.value)} 
                                placeholder="Describe what you have accomplished during this session..." 
                                disabled={isClocking}
                                className="w-full min-h-[120px] p-3.5 text-sm border border-[#E2E8F0] rounded-[4px] bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4B7BEC]/20 transition-all resize-none leading-relaxed custom-scrollbar"
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-end gap-3">
                        <Button 
                            variant="ghost" 
                            className="rounded-[4px] h-10 text-xs font-bold text-slate-500 hover:bg-slate-100" 
                            onClick={() => setClockOutOpen(false)} 
                            disabled={isClocking}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleClockOut} 
                            disabled={isClocking || !clockOutDesc.trim()} 
                            className="bg-red-600 hover:bg-red-700 min-w-[140px] h-10 rounded-[4px] text-xs font-bold shadow-sm"
                        >
                            {isClocking ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                                    Saving...
                                </>
                            ) : "Submit & Clock Out"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

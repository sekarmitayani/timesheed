import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { ApiProject } from "@/lib/types";

export function useTimesheetData() {
    const queryClient = useQueryClient();

    // Filter State (Pure UI)
    const [filterType, setFilterType] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Pagination (Pure UI)
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Clock In/Out UI Dialogs
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [clockOutDesc, setClockOutDesc] = useState("");

    // Detail Modal UI
    const [selectedLog, setSelectedLog] = useState<TimesheetLog | null>(null);
    const [liveElapsed, setLiveElapsed] = useState("");

    // --- Queries ---

    // 1. Fetch Projects
    const { data: projectsData } = useQuery({
        queryKey: ['employee', 'timesheets', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects: ApiProject[] = projectsData?.data || [];

    // 2. Fetch Timesheet Logs
    const { data: rawLogs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['employee', 'timesheets', 'logs'],
        queryFn: () => timesheetService.getMyLogs(),
    });

    const logs = useMemo(() => {
        const data = Array.isArray(rawLogs) ? rawLogs : [];
        return [...data].sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
    }, [rawLogs]);

    const hasActiveSession = useMemo(() => logs.some(l => l.clock_in && !l.clock_out), [logs]);
    const activeLog = useMemo(() => logs.find(l => l.clock_in && !l.clock_out), [logs]);

    // 3. Dependent Mapping Query (Task & User Map)
    const projectIds = useMemo(() => Array.from(new Set(logs.map(l => l.project_id))), [logs]);

    const { data: mapsData, isLoading: isLoadingMaps } = useQuery({
        queryKey: ['employee', 'timesheets', 'maps', projectIds],
        queryFn: async () => {
            const newTaskMap: Record<number, ApiTask> = {};
            const newUserMap: Record<number, string> = {};

            logs.forEach(l => {
                if (l.user) newUserMap[l.user_id] = l.user.full_name;
            });

            await Promise.all(projectIds.map(async (pid) => {
                try {
                    const pTasks = await taskService.getProjectTasks(String(pid));
                    pTasks.forEach(t => { newTaskMap[t.id] = t; });

                    const pMembers = await projectService.getProjectMembers(String(pid));
                    pMembers.forEach(m => { 
                        if (m.user) newUserMap[m.user_id] = m.user.full_name; 
                    });
                } catch { /* skip */ }
            }));

            return { taskMap: newTaskMap, userMap: newUserMap };
        },
        enabled: projectIds.length > 0,
    });

    const taskMap = mapsData?.taskMap || {};
    const userMap = mapsData?.userMap || {};

    const isLoading = isLoadingLogs || (projectIds.length > 0 && isLoadingMaps);

    // --- Mutations ---

    const clockOutMutation = useMutation({
        mutationFn: (desc: string) => timesheetService.clockOut({ task_description: desc }),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', 'timesheets', 'logs'] });
        },
        onSuccess: (res) => {
            toast.success(res.message || "Clock Out successful!");
            setClockOutOpen(false);
            setClockOutDesc("");
        },
        onError: (e: any) => {
            toast.error(e.message || "Clock Out failed");
        }
    });

    const handleClockOut = async () => {
        if (!clockOutDesc.trim()) { toast.error("Description is required"); return; }
        clockOutMutation.mutate(clockOutDesc);
    };

    // --- Computed Logic ---

    const filteredLogs = useMemo(() => {
        let result = [...logs];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (filterType === "daily") {
            result = result.filter(log => new Date(log.clock_in).toDateString() === today.toDateString());
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

        if (filterProject !== "all") {
            result = result.filter(log => log.project_id === Number(filterProject));
        }

        if (filterStatus !== "all") {
            result = result.filter(log => log.status === filterStatus);
        }

        return result;
    }, [logs, filterType, dateFrom, dateTo, filterProject, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, dateFrom, dateTo, filterProject, filterStatus, limit]);

    const paginatedLogs = useMemo(() => {
        return filteredLogs.slice((currentPage - 1) * limit, currentPage * limit);
    }, [filteredLogs, currentPage, limit]);

    const totalPages = Math.ceil(filteredLogs.length / limit);

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

    const resetFilters = () => {
        setFilterType("all");
        setDateFrom("");
        setDateTo("");
        setFilterProject("all");
        setFilterStatus("all");
    };

    useEffect(() => {
        if (!activeLog) {
            setLiveElapsed("");
            return;
        }
        const tick = () => {
            const start = new Date(activeLog.clock_in).getTime();
            const now = Date.now();
            const diffSec = Math.floor((now - start) / 1000);
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;
            setLiveElapsed(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeLog]);

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

    return {
        state: {
            logs,
            isLoading,
            hasActiveSession,
            taskMap,
            userMap,
            filterType,
            dateFrom,
            dateTo,
            filterProject,
            filterStatus,
            currentPage,
            limit,
            clockOutOpen,
            isClocking: clockOutMutation.isPending,
            projects,
            clockOutDesc,
            selectedLog,
            liveElapsed,
        },
        computed: {
            filteredLogs,
            paginatedLogs,
            totalPages,
            dailySummary,
            activeLog,
        },
        actions: {
            setFilterType,
            setDateFrom,
            setDateTo,
            setFilterProject,
            setFilterStatus,
            setCurrentPage,
            setLimit,
            setClockOutOpen,
            setClockOutDesc,
            setSelectedLog,
            handleClockOut,
            resetFilters,
            formatDuration,
            formatTime24,
            formatDateTime,
            getTaskTitle,
        }
    };
}

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { ApiProject } from "@/lib/types";

export function useTimesheetData(rolePrefix: string = "timesheet") {
    const queryClient = useQueryClient();

    // Filter State (Pure UI)
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Pagination (Pure UI)
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Clock In/Out UI Dialogs
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [clockOutTitle, setClockOutTitle] = useState("");
    const [clockOutDesc, setClockOutDesc] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
    const [selectedTaskId, setSelectedTaskId] = useState<string>("none");

    // Detail Modal UI
    const [selectedLog, setSelectedLog] = useState<TimesheetLog | null>(null);
    const [liveElapsed, setLiveElapsed] = useState("");

    // --- Queries ---

    // 1. Fetch Projects
    const { data: projectsData } = useQuery({
        queryKey: [rolePrefix, 'timesheets', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects: ApiProject[] = projectsData?.data || [];

    // 2. Fetch Timesheet Logs
    const { data: rawLogs, isLoading: isLoadingLogs } = useQuery({
        queryKey: [rolePrefix, 'timesheets', 'logs'],
        queryFn: () => timesheetService.getMyLogs(),
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });

    const logs = useMemo(() => {
        const data = Array.isArray(rawLogs) ? rawLogs : [];
        return [...data].sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
    }, [rawLogs]);

    const hasActiveSession = useMemo(() => logs.some(l => l.clock_in && !l.clock_out), [logs]);
    const activeLog = useMemo(() => logs.find(l => l.clock_in && !l.clock_out), [logs]);

    // 3. Dependent Mapping Query (Task & User Map)
    const projectIds = useMemo(() => {
        const validIds = logs
            .map(l => l.project_id)
            .filter((id): id is number => typeof id === "number" && id > 0);
        return Array.from(new Set(validIds));
    }, [logs]);

    const { data: mapsData, isLoading: isLoadingMaps } = useQuery({
        queryKey: [rolePrefix, 'timesheets', 'maps', projectIds],
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

    // 4. Project Tasks for Modal Dropdown
    const { data: projectTasks = [], isLoading: isLoadingProjectTasks } = useQuery({
        queryKey: [rolePrefix, 'timesheets', 'projectTasks', selectedProjectId],
        queryFn: () => taskService.getProjectTasks(selectedProjectId),
        enabled: !!selectedProjectId && selectedProjectId !== "none",
    });

    const isLoading = isLoadingLogs || (projectIds.length > 0 && isLoadingMaps);

    // --- Mutations ---

    const clockInMutation = useMutation({
        mutationFn: async (payload?: { title?: string; project_id?: number | null; task_id?: number | null }) => {
            const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            return timesheetService.clockIn({
                title: payload?.title || `Daily Attendance - ${todayStr}`,
                project_id: payload?.project_id || null,
                task_id: payload?.task_id || null,
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [rolePrefix, 'timesheets', 'logs'] });
        },
        onSuccess: (res) => {
            toast.success(res.message || "Clock In successful!");
        },
        onError: (e: any) => {
            toast.error(e.message || "Clock In failed");
        }
    });

    const clockOutMutation = useMutation({
        mutationFn: (payload: { title?: string; task_description: string; project_id?: number | null; task_id?: number | null }) => 
            timesheetService.clockOut(payload),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [rolePrefix, 'timesheets', 'logs'] });
        },
        onSuccess: (res) => {
            toast.success(res.message || "Clock Out successful!");
            setClockOutOpen(false);
            setClockOutDesc("");
            setClockOutTitle("");
            setSelectedProjectId("none");
            setSelectedTaskId("none");
        },
        onError: (e: any) => {
            toast.error(e.message || "Clock Out failed");
        }
    });

    const pauseMutation = useMutation({
        mutationFn: () => timesheetService.pauseSession(),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [rolePrefix, 'timesheets', 'logs'] });
        },
        onSuccess: () => {
            toast.success("Timesheet session paused");
        },
        onError: (e: any) => {
            toast.error(e.message || "Failed to pause session");
        }
    });

    const resumeMutation = useMutation({
        mutationFn: () => timesheetService.resumeSession(),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [rolePrefix, 'timesheets', 'logs'] });
        },
        onSuccess: () => {
            toast.success("Timesheet session resumed");
        },
        onError: (e: any) => {
            toast.error(e.message || "Failed to resume session");
        }
    });

    const handleClockIn = () => {
        clockInMutation.mutate({});
    };

    const openClockOutDialog = () => {
        if (activeLog) {
            const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            setClockOutTitle(activeLog.title || `Daily Attendance - ${todayStr}`);
            setSelectedProjectId(activeLog.project_id ? String(activeLog.project_id) : "none");
            setSelectedTaskId(activeLog.task_id ? String(activeLog.task_id) : "none");
        }
        setClockOutOpen(true);
    };

    const handleClockOut = async () => {
        if (!clockOutDesc.trim()) { 
            toast.error("Description is required"); 
            return; 
        }
        clockOutMutation.mutate({
            title: clockOutTitle.trim() || undefined,
            task_description: clockOutDesc.trim(),
            project_id: selectedProjectId && selectedProjectId !== "none" ? Number(selectedProjectId) : null,
            task_id: selectedTaskId && selectedTaskId !== "none" ? Number(selectedTaskId) : null,
        });
    };

    const handlePause = () => {
        pauseMutation.mutate();
    };

    const handleResume = () => {
        resumeMutation.mutate();
    };

    // --- Computed Logic ---

    const filteredLogs = useMemo(() => {
        let result = [...logs];

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
    }, [logs, dateFrom, dateTo, filterProject, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [dateFrom, dateTo, filterProject, filterStatus, limit]);

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

        const formatElapsed = (diffSec: number) => {
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;
            return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
        };

        const tick = () => {
            const start = new Date(activeLog.clock_in).getTime();
            const totalPaused = activeLog.total_paused_seconds || 0;

            if (activeLog.is_paused && activeLog.paused_at) {
                const pauseTime = new Date(activeLog.paused_at).getTime();
                const diffSec = Math.max(0, Math.floor((pauseTime - start) / 1000) - totalPaused);
                setLiveElapsed(formatElapsed(diffSec));
            } else {
                const now = Date.now();
                const diffSec = Math.max(0, Math.floor((now - start) / 1000) - totalPaused);
                setLiveElapsed(formatElapsed(diffSec));
            }
        };

        tick();
        if (activeLog.is_paused) {
            return;
        }
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
            dateFrom,
            dateTo,
            filterProject,
            filterStatus,
            currentPage,
            limit,
            clockOutOpen,
            isClockingIn: clockInMutation.isPending,
            isClocking: clockOutMutation.isPending,
            isPausing: pauseMutation.isPending,
            isResuming: resumeMutation.isPending,
            projects,
            clockOutTitle,
            clockOutDesc,
            selectedProjectId,
            selectedTaskId,
            projectTasks,
            isLoadingProjectTasks,
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
            setDateFrom,
            setDateTo,
            setFilterProject,
            setFilterStatus,
            setCurrentPage,
            setLimit,
            setClockOutOpen,
            setClockOutTitle,
            setClockOutDesc,
            setSelectedProjectId,
            setSelectedTaskId,
            setSelectedLog,
            handleClockIn,
            openClockOutDialog,
            handleClockOut,
            handlePause,
            handleResume,
            resetFilters,
            formatDuration,
            formatTime24,
            formatDateTime,
            getTaskTitle,
        }
    };
}

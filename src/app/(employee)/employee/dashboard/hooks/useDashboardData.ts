import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { taskService, ApiTask, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";

export function useDashboardData() {
    const user = useAuthStore((s) => s.user);

    // 1. Fetch Projects
    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['employee', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects: ApiProject[] = projectsData?.data || [];
    const hasProjects = projects.length > 0;

    // 2. Fetch Tasks & Members for all projects
    const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['employee', 'tasks', projects.map((p: ApiProject) => p.id)],
        queryFn: async () => {
            const tasksPromises = projects.map((p: ApiProject) => taskService.getProjectTasks(String(p.id), true).catch(() => []));
            const results = await Promise.all(tasksPromises);
            return results.flat() as ApiTask[];
        },
        enabled: hasProjects,
    });
    const tasks: ApiTask[] = tasksData || [];

    const { data: membersData, isLoading: isLoadingMembers } = useQuery({
        queryKey: ['employee', 'members', projects.map((p: ApiProject) => p.id)],
        queryFn: async () => {
            const membersPromises = projects.map((p: ApiProject) => projectService.getProjectMembers(String(p.id)).catch(() => []));
            const results = await Promise.all(membersPromises);
            return results.flat();
        },
        enabled: hasProjects,
    });
    const allMembers: any[] = membersData || [];

    // 3. Fetch Timesheets
    const { data: timesheetsData, isLoading: isLoadingTimesheets } = useQuery({
        queryKey: ['employee', 'timesheets'],
        queryFn: () => timesheetService.getMyLogs(),
    });
    const timesheets = timesheetsData || [];

    // 4. Fetch Audit Logs for top priority tasks
    const topTasks = useMemo(() => {
        return [...tasks]
            .sort((a, b) => new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime())
            .slice(0, 10);
    }, [tasks]);

    const { data: auditLogsData, isLoading: isLoadingAudit } = useQuery({
        queryKey: ['employee', 'auditLogs', topTasks.map((t: ApiTask) => t.id)],
        queryFn: async () => {
            if (topTasks.length === 0) return [];
            const auditPromises = topTasks.map((t: ApiTask) => taskService.getTaskLogs(t.id).catch(() => []));
            const results = await Promise.all(auditPromises);
            
            const flattened = results.flat().map((log: TaskAuditLog) => {
                if (!log.user) {
                    const member = allMembers.find((m: any) => m.user_id === log.user_id);
                    if (member?.user) {
                        return { ...log, user: { full_name: member.user.full_name } };
                    }
                }
                return log;
            });
            return flattened as TaskAuditLog[];
        },
        enabled: topTasks.length > 0 && !!allMembers.length,
    });
    const auditLogs = auditLogsData || [];

    const isLoading = isLoadingProjects || isLoadingTasks || isLoadingMembers || isLoadingTimesheets || isLoadingAudit;

    const todoCount = useMemo(() => tasks.filter((t: ApiTask) => t.status === "todo").length, [tasks]);

    return {
        state: {
            user,
            isLoading,
            projects,
            tasks,
            timesheets,
            auditLogs,
        },
        computed: {
            todoCount,
        }
    };
}

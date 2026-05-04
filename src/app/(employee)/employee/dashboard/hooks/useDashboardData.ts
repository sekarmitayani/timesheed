import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { taskService, ApiTask, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";
import { toast } from "sonner";

export function useDashboardData() {
    const user = useAuthStore((s) => s.user);
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [timesheets, setTimesheets] = useState<TimesheetLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch projects first
                const projectsRes = await projectService.getProjects(1, 100);
                const projectList = projectsRes.data || [];
                setProjects(projectList);

                // Fetch tasks for all projects where I am assigned
                const tasksPromises = projectList.map(p => taskService.getProjectTasks(String(p.id), true).catch(() => []));
                const membersPromises = projectList.map(p => projectService.getProjectMembers(String(p.id)).catch(() => []));
                
                const [tasksResults, membersResults] = await Promise.all([
                    Promise.all(tasksPromises),
                    Promise.all(membersPromises)
                ]);

                const allTasks = tasksResults.flat();
                setTasks(allTasks);

                // Flatten members to use as a user cache
                const allMembers = membersResults.flat();

                // Fetch my timesheet logs
                const logs = await timesheetService.getMyLogs();
                setTimesheets(logs);

                // Fetch audit logs for priority tasks to show activity
                const topTasks = [...allTasks]
                    .sort((a, b) => new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime())
                    .slice(0, 10);
                
                const auditPromises = topTasks.map(t => taskService.getTaskLogs(t.id).catch(() => []));
                const auditResults = await Promise.all(auditPromises);
                
                // Enrich audits with user names from the members cache
                const flattenedAudits = auditResults.flat().map((log: TaskAuditLog) => {
                    if (!log.user) {
                        const member = allMembers.find(m => m.user_id === log.user_id);
                        if (member?.user) {
                            return { ...log, user: { full_name: member.user.full_name } };
                        }
                    }
                    return log;
                });

                setAuditLogs(flattenedAudits as TaskAuditLog[]);

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                toast.error("Failed to load real dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const todoCount = useMemo(() => tasks.filter((t) => t.status === "todo").length, [tasks]);

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

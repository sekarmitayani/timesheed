"use client";

import { useMemo, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { DashboardHeader } from "./components/DashboardHeader";
import { QuickStatsRow } from "./components/QuickStatsRow";
import { TaskOverviewCard } from "./components/TaskOverviewCard";
import { RecentActivityCard } from "./components/RecentActivityCard";
import { WeeklyHoursChart } from "./components/WeeklyHoursChart";
import { RecentTimesheetTable } from "./components/RecentTimesheetTable";
import { taskService, ApiTask, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";
import { toast } from "sonner";

export default function EmployeeDashboard() {
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
                const tasksPromises = projectList.map(p => taskService.getProjectTasks(p.id, true).catch(() => []));
                const membersPromises = projectList.map(p => projectService.getProjectMembers(p.id).catch(() => []));
                
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
                const flattenedAudits = auditResults.flat().map(log => {
                    if (!log.user) {
                        const member = allMembers.find(m => m.user_id === log.user_id);
                        if (member?.user) {
                            return { ...log, user: { full_name: member.user.full_name } };
                        }
                    }
                    return log;
                });

                setAuditLogs(flattenedAudits);

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

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] opacity-40" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with greeting and live clock */}
            <DashboardHeader userName={user?.full_name || "User"} todoCount={todoCount} />

            {/* Top Row: Quick Time Stats (4 cards) */}
            <QuickStatsRow timesheets={timesheets} />

            {/* Middle Row: Priority Tasks & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TaskOverviewCard 
                    tasks={tasks} 
                    projects={projects} 
                    className="lg:col-span-2 border-slate-100 shadow-sm" 
                />
                <RecentActivityCard 
                    auditLogs={auditLogs} 
                    tasks={tasks}
                    projects={projects}
                    currentUser={user}
                    className="lg:col-span-1 border-slate-100 shadow-sm" 
                />
            </div>

            {/* Bottom Row: Analytics & Recent Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                <WeeklyHoursChart 
                    timesheets={timesheets} 
                    className="h-[450px]" 
                />
                <RecentTimesheetTable 
                    timesheets={timesheets} 
                    tasks={tasks} 
                    projects={projects} 
                    className="h-[450px]" 
                />
            </div>
        </div>
    );
}
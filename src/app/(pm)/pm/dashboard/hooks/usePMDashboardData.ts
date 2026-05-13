import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { resourceService, ResourceRequest } from "@/lib/services/resource-service";
import { approvalService } from "@/lib/services/approval-service";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject } from "@/lib/types";

export interface TeamMemberStats {
    id: number;
    name: string;
    role: string;
    activeTasks: number;
}

export interface PMDashboardData {
    activeProjects: ApiProject[];
    allHistoricalCount: number;
    tasks: ApiTask[];
    teamStats: TeamMemberStats[];
    pendingResources: ResourceRequest[];
    pendingTimesheets: TimesheetLog[];
    stats: {
        activeProjectsCount: number;
        totalTasksCount: number;
        activeMembersCount: number;
        pendingResourcesCount: number;
        pendingTimesheetsCount: number;
        tasksDone: number;
        tasksInProgress: number;
        overloadedMembersCount: number;
    };
    recentTasks: ApiTask[];
}

export function usePMDashboardData() {
    return useQuery<PMDashboardData>({
        queryKey: ["pm-dashboard-data"],
        queryFn: async () => {
            // 1. Fetch Projects assigned to PM
            const projRes = await projectService.getProjects(1, 100);
            const allProjects = projRes.data || [];
            
            const active = allProjects.filter(p => p.status === "active");
            const completed = allProjects.filter(p => p.status === "completed").length;

            // 2. Fetch Tasks & Members for all Active Projects concurrently
            const tasksPromises = active.map(p => taskService.getProjectTasks(p.id).catch(() => []));
            const membersPromises = active.map(p => projectService.getProjectMembers(p.id).catch(() => []));
            
            // 3. Fetch Resource Requests
            const resourcesPromise = resourceService.getResourceRequests().catch(() => []);

            // 4. Fetch Pending Timesheets (Inbox)
            const inboxPromise = approvalService.getInbox("pending").catch(() => []);

            const [tasksResults, membersResults, resourcesResult, inboxResult] = await Promise.all([
                Promise.all(tasksPromises),
                Promise.all(membersPromises),
                resourcesPromise,
                inboxPromise
            ]);

            // Flatten Tasks
            const flattenedTasks = tasksResults.flat() as ApiTask[];

            // Aggregate Team Members
            const memberMap = new Map<number, TeamMemberStats>();
            membersResults.flat().forEach((m: any) => {
                if (!m.user_id) return;
                if (!memberMap.has(m.user_id)) {
                    memberMap.set(m.user_id, {
                        id: m.user_id,
                        name: m.user?.full_name || `User #${m.user_id}`,
                        role: m.role_in_project || "Member",
                        activeTasks: 0
                    });
                }
            });

            // Count Active Tasks per Member
            flattenedTasks.forEach(t => {
                if (t.status !== "done" && t.assigned_to_id) {
                    const member = memberMap.get(t.assigned_to_id);
                    if (member) {
                        member.activeTasks += 1;
                    }
                }
            });

            const teamArr = Array.from(memberMap.values()).sort((a, b) => b.activeTasks - a.activeTasks);
            const pendingReqs = Array.isArray(resourcesResult) ? resourcesResult.filter(r => r.status === "pending") : [];
            const inboxData = Array.isArray(inboxResult) ? inboxResult : (inboxResult?.data || []);

            // Task calculations
            const tasksDone = flattenedTasks.filter(t => t.status === "done").length;
            const tasksInProgress = flattenedTasks.filter(t => t.status === "in_progress").length;
            const overloadedMembersCount = teamArr.filter(m => m.activeTasks >= 5).length;

            const recentTasks = [...flattenedTasks].sort((a, b) => {
                if (a.updated_at && b.updated_at) {
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                }
                return b.id - a.id;
            }).slice(0, 6);

            return {
                activeProjects: active,
                allHistoricalCount: completed,
                tasks: flattenedTasks,
                teamStats: teamArr,
                pendingResources: pendingReqs,
                pendingTimesheets: inboxData,
                stats: {
                    activeProjectsCount: active.length,
                    totalTasksCount: flattenedTasks.length,
                    activeMembersCount: teamArr.length,
                    pendingResourcesCount: pendingReqs.length,
                    pendingTimesheetsCount: inboxData.length,
                    tasksDone,
                    tasksInProgress,
                    overloadedMembersCount
                },
                recentTasks
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

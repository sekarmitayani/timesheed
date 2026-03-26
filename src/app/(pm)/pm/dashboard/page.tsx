"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderKanban, Users, AlertTriangle, ListTodo, Activity, CheckCircle2, Clock, Loader2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard, PageHeader } from "@/components/ai/ai-components";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { resourceService, ResourceRequest } from "@/lib/services/resource-service";
import { ApiProject, ProjectMember } from "@/lib/types";

// Interface for aggregated team payload
interface TeamMemberStats {
    id: number;
    name: string;
    role: string;
    activeTasks: number;
}

export default function PMDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    
    // Core Data States
    const [activeProjects, setActiveProjects] = useState<ApiProject[]>([]);
    const [allHistoricalCount, setAllHistoricalCount] = useState(0);
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
    const [pendingResources, setPendingResources] = useState<ResourceRequest[]>([]);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Projects assigned to PM
            const projRes = await projectService.getProjects(1, 100);
            const allProjects = projRes.data || [];
            
            const active = allProjects.filter(p => p.status === "active");
            const completed = allProjects.filter(p => p.status === "completed").length;
            
            setActiveProjects(active);
            setAllHistoricalCount(completed);

            // 2. Fetch Tasks & Members for all Active Projects concurrently
            const tasksPromises = active.map(p => taskService.getProjectTasks(p.id).catch(() => []));
            const membersPromises = active.map(p => projectService.getProjectMembers(p.id).catch(() => []));
            
            // 3. Fetch Resource Requests (if PM has access, otherwise it falls back to empty)
            const resourcesPromise = resourceService.getResourceRequests().catch(() => []);

            const [tasksResults, membersResults, resourcesResult] = await Promise.all([
                Promise.all(tasksPromises),
                Promise.all(membersPromises),
                resourcesPromise
            ]);

            // Flatten Tasks
            const flattenedTasks = tasksResults.flat() as ApiTask[];
            setTasks(flattenedTasks);

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

            // Convert to array and sort by workload
            const teamArr = Array.from(memberMap.values()).sort((a, b) => b.activeTasks - a.activeTasks);
            setTeamStats(teamArr);

            // Process Resources
            const pendingReqs = Array.isArray(resourcesResult) ? resourcesResult.filter(r => r.status === "pending") : [];
            setPendingResources(pendingReqs);

        } catch (e) {
            console.error("Failed to load dashboard data:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Project Dashboard" description="Loading your operational overview..." />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-[#2568C1] mx-auto" />
                        <p className="text-sm text-slate-500">Syncing live dashboard data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Task calculations
    const tasksDone = tasks.filter(t => t.status === "done").length;
    const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
    
    // Sort recent tasks by ID (assuming higher ID = newer) or updated_at
    const recentTasks = [...tasks].sort((a, b) => {
        if (a.updated_at && b.updated_at) {
             return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return b.id - a.id;
    }).slice(0, 6);

    const overloadedMembersCount = teamStats.filter(m => m.activeTasks >= 5).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Project Dashboard" description="Live overview of your projects and team operational performance." />

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Active Projects" 
                    value={activeProjects.length} 
                    subtitle={`${allHistoricalCount} completed historically`} 
                    icon={FolderKanban} 
                    theme="primary"
                />
                <StatCard 
                    title="Total Tasks (Active)" 
                    value={tasks.length} 
                    subtitle={`${tasksDone} Done / ${tasksInProgress} In Progress`} 
                    icon={ListTodo} 
                    theme="secondary"
                />
                <StatCard 
                    title="Active Team Members" 
                    value={teamStats.length} 
                    subtitle={`${overloadedMembersCount} members heavily loaded`} 
                    icon={Users} 
                    theme="ai"
                />
                <StatCard 
                    title="Pending Resources" 
                    value={pendingResources.length} 
                    subtitle="Requests awaiting action" 
                    icon={Package} 
                    glow={pendingResources.length > 0} 
                    theme="destructive"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Center / Left Panel: Projects & Team */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Project Progress Tracker */}
                    <Card className="border-[#e2e8f0] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                <Activity className="h-4 w-4 text-[#2568C1]" /> Active Projects Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {activeProjects.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center">No active projects to track.</p>
                            ) : (
                                activeProjects.map((project) => {
                                    const pTasks = tasks.filter(t => t.project_id === project.id);
                                    const pDone = pTasks.filter(t => t.status === "done").length;
                                    const pTotal = pTasks.length;
                                    const progressPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                                    
                                    return (
                                        <div key={project.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-[#2568C1]/30 hover:shadow-sm transition-all space-y-3 group cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#2568C1] transition-colors">{project.name}</h4>
                                                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">{project.client_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-[#0f172a] block">{progressPct}%</span>
                                                    <span className="text-[10px] text-slate-500 block">{pDone} / {pTotal} Tasks Done</span>
                                                </div>
                                            </div>
                                            <Progress value={progressPct} className="h-2 bg-slate-100 [&>div]:bg-[#2568C1]" />
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Workload Summary */}
                    <Card className="border-[#e2e8f0] shadow-sm rounded-xl">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#f59e0b]" /> Team Workload Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {teamStats.length === 0 ? (
                                <p className="text-sm text-slate-500 py-6 text-center">No team members available.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {teamStats.slice(0, 5).map((member, i) => {
                                        const isOverloaded = member.activeTasks >= 5;
                                        return (
                                            <div key={member.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-slate-200">
                                                        <AvatarFallback className="text-xs font-bold text-[#2568C1] bg-blue-50">
                                                            {member.name.split(" ").slice(0, 2).map(n => n?.[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#0f172a]">{member.name}</p>
                                                        <p className="text-[11px] text-slate-500">{member.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <span className="block text-sm font-bold text-[#0f172a]">{member.activeTasks}</span>
                                                        <span className="block text-[10px] text-slate-500 uppercase">Active Tasks</span>
                                                    </div>
                                                    <div className="w-[100px]">
                                                        <div className="flex justify-between text-[10px] mb-1 font-medium">
                                                            <span className={isOverloaded ? "text-amber-600" : "text-[#2568C1]"}>
                                                                {isOverloaded ? "High Load" : "Optimal"}
                                                            </span>
                                                        </div>
                                                        <Progress 
                                                            value={Math.min((member.activeTasks / 8) * 100, 100)} 
                                                            className={`h-1.5 ${isOverloaded ? "[&>div]:bg-amber-500" : "[&>div]:bg-[#2568C1]"}`} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Recent Activities Feed */}
                <div className="lg:col-span-1">
                    <Card className="border-[#e2e8f0] shadow-sm rounded-xl h-full">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#2568C1]" /> Recent Task Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {recentTasks.length === 0 ? (
                                <p className="text-sm text-slate-500 py-4 text-center">No recent tasks recorded.</p>
                            ) : (
                                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                                    {recentTasks.map((task) => {
                                        const isDone = task.status === "done";
                                        const Icon = isDone ? CheckCircle2 : Clock;
                                        const colorClass = isDone ? "text-emerald-500" : "text-[#2568C1]";
                                        const bgClass = isDone ? "bg-emerald-50" : "bg-blue-50";
                                        
                                        // Find assignee name from team stats
                                        const member = teamStats.find(m => m.id === task.assigned_to_id);
                                        const assigneeName = member ? member.name : `User #${task.assigned_to_id}`;

                                        return (
                                            <div key={task.id} className="relative pl-6">
                                                <div className={`absolute -left-[11px] p-0.5 rounded-full bg-white border-2 border-white`}>
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}>
                                                        <Icon className="h-2.5 w-2.5" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-bold text-[#0f172a]">{assigneeName}</span> 
                                                        {isDone ? " completed the task " : " updated task "} 
                                                        <span className="font-medium text-[#0f172a]">{task.title}</span>
                                                    </p>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Recently'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

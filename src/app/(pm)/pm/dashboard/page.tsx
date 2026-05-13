"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ai/ai-components";
import { usePMDashboardData } from "./hooks/usePMDashboardData";
import { PMQuickStatsRow } from "./components/PMQuickStatsRow";
import { ActiveProjectsTracker } from "./components/ActiveProjectsTracker";
import { TimesheetApprovalInbox } from "./components/TimesheetApprovalInbox";
import { RecentActivitiesFeed } from "./components/RecentActivitiesFeed";

export default function PMDashboard() {
    const { data, isLoading, isError } = usePMDashboardData();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Project Dashboard" description="Loading your operational overview..." />
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-[#4B7BEC] mb-4" />
                    <p className="text-sm font-medium text-slate-500">Syncing live dashboard data...</p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="space-y-6">
                <PageHeader title="Project Dashboard" description="Operational overview." />
                <div className="p-8 border border-red-100 bg-red-50 rounded-xl text-center">
                    <p className="text-sm font-bold text-red-600">Failed to load dashboard data. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Project Dashboard" 
                description="Live overview of your projects and team operational performance." 
            />

            {/* Row 1: KPI Stats */}
            <PMQuickStatsRow stats={data.stats} />

            {/* Row 2: Operation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ActiveProjectsTracker 
                    projects={data.activeProjects} 
                    tasks={data.tasks} 
                />
                
                <TimesheetApprovalInbox 
                    pendingTimesheets={data.pendingTimesheets} 
                />

                <RecentActivitiesFeed 
                    recentTasks={data.recentTasks} 
                    teamStats={data.teamStats} 
                />
            </div>
        </div>
    );
}

"use client";

import { KpiCardsSkeleton, DashboardCardSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { usePMDashboardData } from "./hooks/usePMDashboardData";
import { PMQuickStatsRow } from "./components/PMQuickStatsRow";
import { ActiveProjectsTracker } from "./components/ActiveProjectsTracker";
import { TimesheetApprovalInbox } from "./components/TimesheetApprovalInbox";
import { RecentActivitiesFeed } from "./components/RecentActivitiesFeed";
import { RecentResourceActivities } from "./components/RecentResourceActivities";
import { useAuthStore } from "@/store/useAuthStore";
import { PMDashboardHeader } from "./components/PMDashboardHeader";

export default function PMDashboard() {
    const user = useAuthStore((s) => s.user);
    const { data, isLoading, isError } = usePMDashboardData();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PMDashboardHeader userName={user?.full_name || "Manager"} activeProjectsCount={0} />
                <KpiCardsSkeleton count={4} />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <DashboardCardSkeleton className="lg:col-span-3" bodyHeight="h-80" />
                    <DashboardCardSkeleton className="lg:col-span-2" bodyHeight="h-80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashboardCardSkeleton bodyHeight="h-64" />
                    <DashboardCardSkeleton bodyHeight="h-64" />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="space-y-6">
                <PMDashboardHeader userName={user?.full_name || "Manager"} activeProjectsCount={0} />
                <div className="p-8 border border-red-100 bg-red-50 rounded-xl text-center">
                    <p className="text-sm font-bold text-red-600">Failed to load dashboard data. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PMDashboardHeader userName={user?.full_name || "Manager"} activeProjectsCount={data.stats.activeProjectsCount} />

            {/* Row 1: KPI Stats */}
            <PMQuickStatsRow stats={data.stats} />

            {/* Row 2: Operation Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 flex flex-col">
                    <ActiveProjectsTracker 
                        projects={data.activeProjects} 
                        tasks={data.tasks} 
                    />
                </div>
                
                <div className="xl:col-span-2 flex flex-col">
                    <TimesheetApprovalInbox 
                        pendingTimesheets={data.pendingTimesheets} 
                    />
                </div>
            </div>

            {/* Row 3: Activity Cards (Bottom 2x2 Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecentActivitiesFeed 
                    recentTasks={data.recentTasks} 
                    teamStats={data.teamStats} 
                    projects={data.activeProjects}
                />
                
                <RecentResourceActivities 
                    activities={data.recentResources}
                />
            </div>
        </div>
    );
}

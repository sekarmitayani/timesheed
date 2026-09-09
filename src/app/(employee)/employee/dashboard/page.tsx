"use client";

import { KpiCardsSkeleton, DashboardCardSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { DashboardHeader } from "./components/DashboardHeader";
import { QuickStatsRow } from "./components/QuickStatsRow";
import { TaskOverviewCard } from "./components/TaskOverviewCard";
import { RecentActivityCard } from "./components/RecentActivityCard";
import { WeeklyHoursChart } from "./components/WeeklyHoursChart";
import { RecentTimesheetTable } from "./components/RecentTimesheetTable";
import { useDashboardData } from "./hooks/useDashboardData";

export default function EmployeeDashboard() {
    const { state, computed } = useDashboardData();

    if (state.isLoading) {
        return (
            <div className="space-y-6">
                <DashboardHeader userName={state.user?.full_name || "User"} todoCount={0} />
                <KpiCardsSkeleton count={4} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <DashboardCardSkeleton className="lg:col-span-2" bodyHeight="h-72" />
                    <DashboardCardSkeleton className="lg:col-span-1" bodyHeight="h-72" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <DashboardCardSkeleton className="lg:col-span-1" bodyHeight="h-64" />
                    <DashboardCardSkeleton className="lg:col-span-2" bodyHeight="h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with greeting and live clock */}
            <DashboardHeader userName={state.user?.full_name || "User"} todoCount={computed.todoCount} />

            {/* Top Row: Quick Time Stats (4 cards) */}
            <QuickStatsRow timesheets={state.timesheets} />

            {/* Middle Row: Priority Tasks & Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <TaskOverviewCard 
                    tasks={state.tasks} 
                    projects={state.projects} 
                    className="xl:col-span-2 border-slate-100 shadow-sm" 
                />
                <RecentActivityCard 
                    auditLogs={state.auditLogs} 
                    tasks={state.tasks}
                    projects={state.projects}
                    currentUser={state.user || null}
                    className="xl:col-span-1 border-slate-100 shadow-sm" 
                />
            </div>

            {/* Bottom Row: Analytics & Recent Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WeeklyHoursChart 
                    timesheets={state.timesheets} 
                    className="h-[450px]" 
                />
                <RecentTimesheetTable 
                    timesheets={state.timesheets} 
                    tasks={state.tasks} 
                    projects={state.projects} 
                    className="h-[450px]" 
                />
            </div>
        </div>
    );
}

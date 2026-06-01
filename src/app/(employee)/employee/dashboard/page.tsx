"use client";

import { Loader2 } from "lucide-react";
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
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] opacity-40" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with greeting and live clock */}
            <DashboardHeader userName={state.user?.full_name || "User"} todoCount={computed.todoCount} />

            {/* Top Row: Quick Time Stats (4 cards) */}
            <QuickStatsRow timesheets={state.timesheets} />

            {/* Middle Row: Priority Tasks & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TaskOverviewCard 
                    tasks={state.tasks} 
                    projects={state.projects} 
                    className="lg:col-span-2 border-slate-100 shadow-sm" 
                />
                <RecentActivityCard 
                    auditLogs={state.auditLogs} 
                    tasks={state.tasks}
                    projects={state.projects}
                    currentUser={state.user || null}
                    className="lg:col-span-1 border-slate-100 shadow-sm" 
                />
            </div>

            {/* Bottom Row: Analytics & Recent Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
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

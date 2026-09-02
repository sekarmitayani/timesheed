"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/ai/ai-components";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTimesheetData } from "./hooks/useTimesheetData";
import { TimesheetFilters } from "./components/sections/TimesheetFilters";
import { WeeklySummary } from "./components/sections/WeeklySummary";
import { ActiveSessionBanner } from "./components/sections/ActiveSessionBanner";
import { TimesheetTable } from "./components/sections/TimesheetTable";

// Dynamic Imports for heavy modals
const ClockOutDialog = dynamic(() => import("./components/ClockOutDialog").then(mod => mod.ClockOutDialog), {
    loading: () => null
});
const TimesheetDetailModal = dynamic(() => import("./components/TimesheetDetailModal").then(mod => mod.TimesheetDetailModal), {
    loading: () => null
});

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    pending: { 
        bg: "bg-amber-50", 
        text: "text-amber-700", 
        icon: Clock, 
        label: "Pending" 
    },
    approved: { 
        bg: "bg-emerald-50", 
        text: "text-emerald-700", 
        icon: CheckCircle2, 
        label: "Approved" 
    },
    rejected: { 
        bg: "bg-red-50", 
        text: "text-red-700", 
        icon: XCircle, 
        label: "Rejected" 
    },
};

export default function TimesheetPage() {
    const { state, computed, actions } = useTimesheetData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Timesheet Management" description="Monitor and track your work sessions and daily productivity." />

            <TimesheetFilters 
                dateFrom={state.dateFrom}
                setDateFrom={actions.setDateFrom}
                dateTo={state.dateTo}
                setDateTo={actions.setDateTo}
                filterProject={state.filterProject}
                setFilterProject={actions.setFilterProject}
                filterStatus={state.filterStatus}
                setFilterStatus={actions.setFilterStatus}
                limit={state.limit}
                setLimit={actions.setLimit}
                projects={state.projects}
                resetFilters={actions.resetFilters}
            />

            <WeeklySummary dailySummary={computed.dailySummary} />

            <ActiveSessionBanner 
                activeLog={computed.activeLog}
                liveElapsed={state.liveElapsed}
                onClockOut={() => actions.setClockOutOpen(true)}
                onPause={actions.handlePause}
                onResume={actions.handleResume}
                isPausing={state.isPausing}
                isResuming={state.isResuming}
                getTaskTitle={actions.getTaskTitle}
                formatTime24={actions.formatTime24}
            />

            <TimesheetTable 
                logs={computed.filteredLogs}
                paginatedLogs={computed.paginatedLogs}
                isLoading={state.isLoading}
                currentPage={state.currentPage}
                totalPages={computed.totalPages}
                limit={state.limit}
                statusConfig={statusConfig}
                
                setCurrentPage={actions.setCurrentPage}
                setSelectedLog={actions.setSelectedLog}
                
                getTaskTitle={actions.getTaskTitle}
                formatTime24={actions.formatTime24}
                formatDuration={actions.formatDuration}
            />

            {/* Lazy Loaded Modals */}
            {state.clockOutOpen && (
                <ClockOutDialog 
                    open={state.clockOutOpen}
                    onOpenChange={actions.setClockOutOpen}
                    isClocking={state.isClocking}
                    clockOutDesc={state.clockOutDesc}
                    setClockOutDesc={actions.setClockOutDesc}
                    onClockOut={actions.handleClockOut}
                />
            )}
            
            {state.selectedLog && (
                <TimesheetDetailModal 
                    selectedLog={state.selectedLog}
                    onClose={() => actions.setSelectedLog(null)}
                    getTaskTitle={actions.getTaskTitle}
                    statusConfig={statusConfig}
                    formatDateTime={actions.formatDateTime}
                    formatDuration={actions.formatDuration}
                    taskMap={state.taskMap}
                    userMap={state.userMap}
                />
            )}
        </div>
    );
}

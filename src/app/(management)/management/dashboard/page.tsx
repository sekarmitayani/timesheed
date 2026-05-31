"use client";

import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useManagementDashboardData } from "./hooks/useManagementDashboardData";
import { ManagementDashboardHeader } from "./components/ManagementDashboardHeader";
import { KpiStatsRow } from "./components/KpiStatsRow";
import { FinancialHealthCard } from "./components/FinancialHealthCard";
import { WorkingHoursCard } from "./components/WorkingHoursCard";

export default function ExecutiveDashboard() {
    const user = useAuthStore((s) => s.user);
    const {
        isLoading,
        kpiStats,
        financialHealth,
        workingHours,
        projectEfficiency,
    } = useManagementDashboardData();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <ManagementDashboardHeader userName={user?.full_name || "Executive"} />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-[#4B7BEC] mx-auto" />
                        <p className="text-sm text-slate-500">Aggregating data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ManagementDashboardHeader userName={user?.full_name || "Executive"} />

            {/* Row 1: KPI Stats */}
            <KpiStatsRow stats={kpiStats} />

            {/* Row 2: Financial Health + Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <FinancialHealthCard data={financialHealth} />
                <WorkingHoursCard
                    workingHours={workingHours}
                    projectEfficiency={projectEfficiency}
                />
            </div>
        </div>
    );
}

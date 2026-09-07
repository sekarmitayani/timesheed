"use client";

import { KpiCardsSkeleton, DashboardCardSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useManagementDashboardData } from "./hooks/useManagementDashboardData";
import { ManagementDashboardHeader } from "./components/ManagementDashboardHeader";
import { KpiStatsRow } from "./components/KpiStatsRow";
import { FinancialHealthCard } from "./components/FinancialHealthCard";
import { WorkingHoursCard } from "./components/WorkingHoursCard";
import { ProfitabilitySnapshotCard } from "./components/ProfitabilitySnapshotCard";
import { CostBreakdownMiniCard } from "./components/CostBreakdownMiniCard";
import { LiabilitySnapshotCard } from "./components/LiabilitySnapshotCard";
import { ResourcesOverviewCard } from "./components/ResourcesOverviewCard";
import { TopProjectsCard } from "./components/TopProjectsCard";

export default function ExecutiveDashboard() {
    const user = useAuthStore((s) => s.user);
    const {
        isLoading,
        kpiStats,
        financialHealth,
        workingHours,
        projectEfficiency,
        profitabilitySnapshot,
        costBreakdownMini,
        liabilitySnapshot,
        resourcesOverview,
        topProjects,
    } = useManagementDashboardData();

    if (isLoading) {
        return (
            <div className="space-y-3">
                <ManagementDashboardHeader userName={user?.full_name || "Executive"} />
                <KpiCardsSkeleton count={4} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                    <DashboardCardSkeleton className="md:col-span-2" bodyHeight="h-72" />
                    <DashboardCardSkeleton className="md:col-span-1" bodyHeight="h-72" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                    <DashboardCardSkeleton bodyHeight="h-64" />
                    <DashboardCardSkeleton bodyHeight="h-64" />
                    <DashboardCardSkeleton bodyHeight="h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <ManagementDashboardHeader userName={user?.full_name || "Executive"} />

            {/* Row 1: KPI Stats */}
            <KpiStatsRow stats={kpiStats} />

            {/* Row 2: Financial Health + Profitability Sparkline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                <FinancialHealthCard data={financialHealth} />
                <ProfitabilitySnapshotCard data={profitabilitySnapshot} isLoading={isLoading} />
            </div>

            {/* Row 3: Cost Breakdown Mini + Liability Snapshot + Resources Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                <CostBreakdownMiniCard data={costBreakdownMini} isLoading={isLoading} />
                <LiabilitySnapshotCard data={liabilitySnapshot} isLoading={isLoading} />
                <ResourcesOverviewCard data={resourcesOverview} isLoading={isLoading} />
            </div>

            {/* Row 4: Working Hours + Top Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <WorkingHoursCard
                    workingHours={workingHours}
                    projectEfficiency={projectEfficiency}
                />
                <TopProjectsCard data={topProjects} isLoading={isLoading} />
            </div>
        </div>
    );
}

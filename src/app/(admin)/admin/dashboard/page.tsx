"use client";

import { Loader2 } from "lucide-react";
import { useAdminDashboardData } from "./hooks/useAdminDashboardData";
import { QuickStatsRow } from "./components/QuickStatsRow";
import { ProjectDistributionCard } from "./components/ProjectDistributionCard";
import { PaymentStatusCard } from "./components/PaymentStatusCard";
import { PendingApprovalsCard } from "./components/PendingApprovalsCard";
import { RecentActivityCard } from "./components/RecentActivityCard";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminDashboardHeader } from "./components/AdminDashboardHeader";

export default function AdminDashboard() {
    const user = useAuthStore((s) => s.user);
    const {
        isLoading,
        stats,
        projectFinancials,
        pendingResourceList,
        recentResources
    } = useAdminDashboardData();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <AdminDashboardHeader userName={user?.full_name || "Admin"} pendingCount={0} />
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
            <AdminDashboardHeader userName={user?.full_name || "Admin"} pendingCount={stats.pendingResources} />

            {/* Row 1: KPI Stats */}
            <QuickStatsRow stats={stats} />

            {/* Row 2: Financial Overview + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ProjectDistributionCard projectFinancials={projectFinancials} />
                <PaymentStatusCard stats={stats} />
            </div>

            {/* Row 3: Needs Attention + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PendingApprovalsCard requests={pendingResourceList} />
                <RecentActivityCard activities={recentResources} />
            </div>
        </div>
    );
}

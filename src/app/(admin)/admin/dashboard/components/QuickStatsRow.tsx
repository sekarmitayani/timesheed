"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
    Users, 
    FolderKanban, 
    WalletCards, 
    Package 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardStats } from "../hooks/useAdminDashboardData";

interface QuickStatsRowProps {
    stats: DashboardStats;
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
    const router = useRouter();

    const fmtCurrencyShort = (v: number) => {
        if (v >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
        if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[78px] flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-0 py-0 gap-0";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Users */}
            <Card className={cardClass} onClick={() => router.push("/admin/users")}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                        <Users className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Users</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">{stats.totalUsers}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{stats.activeUsers} Active</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Active Projects */}
            <Card className={cardClass} onClick={() => router.push("/admin/projects")}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <FolderKanban className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Projects</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">{stats.activeProjects}</span>
                            <span className="text-[10px] font-semibold text-slate-400">/ {stats.totalProjects} Total</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Outstanding Bills (Total Unpaid) */}
            <Card className={cardClass} onClick={() => router.push("/admin/payroll")}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <WalletCards className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Outstanding Bills</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">{fmtCurrencyShort(stats.totalUnpaid)}</span>
                            <span className="text-[10px] font-semibold text-slate-400">Unpaid</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Pending Requests */}
            <Card className={cardClass} onClick={() => router.push("/admin/resources")}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pending Requests</p>
                        <div className="text-xl sm:text-2xl font-black text-[#4B7BEC] tracking-tight leading-none truncate">
                            {stats.pendingResources}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

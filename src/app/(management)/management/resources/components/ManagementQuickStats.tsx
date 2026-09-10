"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle2, Wallet, XCircle } from "lucide-react";
import { ManagementResourceStats } from "@/lib/services/management-service";

interface ManagementQuickStatsProps {
    stats?: ManagementResourceStats;
    isLoading: boolean;
}

export function ManagementQuickStats({ stats, isLoading }: ManagementQuickStatsProps) {
    const fmtCurrencyShort = (v: number) => {
        if (!v) return "Rp 0";
        if (v >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
        if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[78px] flex flex-col overflow-hidden hover:shadow-md transition-shadow p-0 py-0 gap-0";

    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className={cardClass}>
                        <CardContent className="px-3.5 sm:px-4 py-2.5 flex items-center gap-3 sm:gap-3.5 h-full">
                            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-2.5 bg-slate-100 rounded w-20 animate-pulse" />
                                <div className="h-5 bg-slate-100 rounded w-16 animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Dana Disetujui */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Wallet className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Approved Funds</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-base sm:text-xl xl:text-2xl font-black text-slate-800 tracking-tight leading-none">{fmtCurrencyShort(stats.total_amount_spent)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Total Approved */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Approved</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-base sm:text-xl xl:text-2xl font-black text-slate-800 tracking-tight leading-none">{stats.total_approved}</span>
                            <span className="text-[10px] font-semibold text-slate-400">Requests</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Total Pending */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Package className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Pending</p>
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-base sm:text-xl xl:text-2xl font-black text-slate-800 tracking-tight leading-none">{stats.total_pending}</span>
                            <span className="text-[10px] font-semibold text-slate-400">Requests</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Total Rejected */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                        <XCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">Rejected</p>
                        <div className="text-base sm:text-xl xl:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                            {stats.total_rejected}
                            <span className="text-[10px] font-semibold text-slate-400 ml-1.5">Requests</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

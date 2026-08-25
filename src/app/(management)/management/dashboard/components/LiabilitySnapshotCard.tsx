"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, ArrowRight, Building2 } from "lucide-react";
import { LiabilityMonitorResponse } from "@/lib/services/management-service";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface LiabilitySnapshotCardProps {
    data?: LiabilityMonitorResponse;
    isLoading: boolean;
}

const fmtCurrencyShort = (v: number): string => {
    if (!v) return "Rp 0";
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
    return `Rp ${v.toLocaleString("id-ID")}`;
};

export function LiabilitySnapshotCard({ data, isLoading }: LiabilitySnapshotCardProps) {
    if (isLoading) {
        return (
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-1 border-b border-slate-50">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="p-3 flex-1">
                    <Skeleton className="h-8 w-32 mb-4" />
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const topGroups = (data?.groups || [])
        .filter(g => g.liability > 0)
        .sort((a, b) => b.liability - a.liability)
        .slice(0, 3);

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-4 py-3 border-b border-slate-100 [&.border-b]:py-3 flex flex-row items-center justify-between min-h-[52px]">
                <div className="flex flex-col justify-center">
                    <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Landmark className="h-3.5 w-3.5 text-[#4B7BEC]" /> Liability Snapshot
                    </CardTitle>
                    <p className="text-[9px] text-slate-400 font-medium ml-5 mt-0.5">Unpaid salaries overview</p>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="px-4 pt-3 pb-2 flex-1 flex flex-col justify-between">
                    <div className="flex items-baseline gap-1.5 mb-2 px-1">
                        <span className="text-xl font-black text-slate-800 tracking-tight truncate">
                            {fmtCurrencyShort(data?.total_liability || 0)}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 leading-tight">Total Liability</span>
                    </div>

                    <div className="flex-1 min-h-[120px]">
                        {topGroups.length > 0 ? (
                            <div className="space-y-1.5">
                                {topGroups.map((g, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50/50 border border-slate-100/60">
                                        <div className="flex items-center gap-2 min-w-0 max-w-[65%]">
                                            <div className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                                                <Building2 className="h-3 w-3" />
                                            </div>
                                            <span className="font-bold text-slate-700 truncate">{g.project_name}</span>
                                        </div>
                                        <span className="font-black text-red-500 tabular-nums">
                                            {fmtCurrencyShort(g.liability)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
                                No active liabilities
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 py-2.5 mt-auto border-t border-slate-100 flex justify-end shrink-0">
                    <Link 
                        href="/management/liability" 
                        className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5] flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                        View Details <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

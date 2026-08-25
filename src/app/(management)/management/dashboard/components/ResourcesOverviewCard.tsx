"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ManagementResourceStats } from "@/lib/services/management-service";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface ResourcesOverviewCardProps {
    data?: ManagementResourceStats;
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

export function ResourcesOverviewCard({ data, isLoading }: ResourcesOverviewCardProps) {
    if (isLoading) {
        return (
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-1 border-b border-slate-50">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="p-3 flex-1">
                    <Skeleton className="h-8 w-32 mb-4" />
                    <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-4 py-3 border-b border-slate-100 [&.border-b]:py-3 flex flex-row items-center justify-between min-h-[52px]">
                <div className="flex flex-col justify-center">
                    <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-[#4B7BEC]" /> Resources Overview
                    </CardTitle>
                    <p className="text-[9px] text-slate-400 font-medium ml-5 mt-0.5">Resource requests summary</p>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="px-4 pt-3 pb-2 flex-1 flex flex-col justify-between">
                    <div className="flex items-baseline gap-1.5 mb-2 px-1">
                        <span className="text-xl font-black text-slate-800 tracking-tight truncate">
                            {fmtCurrencyShort(data?.total_amount_spent || 0)}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 leading-tight">Approved Funds</span>
                    </div>

                    <div className="flex-1 min-h-[120px] flex items-center">
                        <div className="grid grid-cols-3 gap-2 w-full">
                            <div className="border border-emerald-100/80 bg-emerald-50/30 rounded-lg p-2 text-center">
                                <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
                                    <CheckCircle2 className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-black text-slate-800 tracking-tight block">
                                    {data?.total_approved || 0}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    Approved
                                </span>
                            </div>

                            <div className="border border-amber-100/80 bg-amber-50/30 rounded-lg p-2 text-center">
                                <div className="flex items-center justify-center gap-1 text-amber-600 mb-0.5">
                                    <Clock className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-black text-slate-800 tracking-tight block">
                                    {data?.total_pending || 0}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    Pending
                                </span>
                            </div>

                            <div className="border border-red-100/80 bg-red-50/30 rounded-lg p-2 text-center">
                                <div className="flex items-center justify-center gap-1 text-red-600 mb-0.5">
                                    <XCircle className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-black text-slate-800 tracking-tight block">
                                    {data?.total_rejected || 0}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    Rejected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2.5 mt-auto border-t border-slate-100 flex justify-end shrink-0">
                    <Link 
                        href="/management/resources" 
                        className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5] flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                        View Details <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

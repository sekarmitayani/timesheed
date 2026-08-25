"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieIcon, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CostBreakdownSummaryResponse } from "@/lib/services/management-service";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface CostBreakdownMiniCardProps {
    data?: CostBreakdownSummaryResponse;
    isLoading: boolean;
}

const CHART_COLORS = ["#4B7BEC", "#94A3B8", "#93C5FD", "#6366F1", "#A78BFA"];

const fmtCurrencyShort = (v: number): string => {
    if (!v) return "Rp 0";
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
    return `Rp ${v.toLocaleString("id-ID")}`;
};

export function CostBreakdownMiniCard({ data, isLoading }: CostBreakdownMiniCardProps) {
    if (isLoading) {
        return (
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-1 border-b border-slate-50">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="p-3 flex-1 flex flex-col justify-center">
                    <Skeleton className="h-[100px] w-[100px] rounded-full mx-auto" />
                </CardContent>
            </Card>
        );
    }

    const dist = data?.distribution || [];
    const chartData = dist.map((item, idx) => ({
        name: item.category,
        value: item.amount,
        color: CHART_COLORS[idx % CHART_COLORS.length]
    }));

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-4 py-3 border-b border-slate-100 [&.border-b]:py-3 flex flex-row items-center justify-between min-h-[52px]">
                <div className="flex flex-col justify-center">
                    <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <PieIcon className="h-3.5 w-3.5 text-[#4B7BEC]" /> Cost Breakdown
                    </CardTitle>
                    <p className="text-[9px] text-slate-400 font-medium ml-5 mt-0.5">Last 30 days expenses</p>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="px-4 pt-3 pb-2 flex-1 flex flex-col justify-between">
                    <div className="flex items-center gap-4 my-auto">
                        <div className="w-[110px] h-[110px] shrink-0 relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="58%"
                                            outerRadius="95%"
                                            dataKey="value"
                                            strokeWidth={1.5}
                                            stroke="#fff"
                                        >
                                            {chartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                                    <span className="text-[9px] text-slate-400 font-medium">N/A</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Expenses</p>
                                <p className="text-base font-black text-slate-800 tracking-tight truncate mt-1">
                                    {fmtCurrencyShort(data?.total_expenses?.value || 0)}
                                </p>
                            </div>
                            <div className="space-y-1.5 border-t border-slate-50 pt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium truncate">Salary</span>
                                    <span className="font-bold text-slate-800">{fmtCurrencyShort(data?.salary_comp?.value || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium truncate">Resources</span>
                                    <span className="font-bold text-slate-800">{fmtCurrencyShort(data?.resource_requests?.value || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2.5 mt-auto border-t border-slate-100 flex justify-end shrink-0">
                    <Link 
                        href="/management/cost-breakdown" 
                        className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5] flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                        View Details <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

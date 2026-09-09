"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MonthlyProfitItem } from "@/lib/services/management-service";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfitabilitySnapshotCardProps {
    data?: MonthlyProfitItem[];
    isLoading: boolean;
}

const fmtCurrencyShort = (v: number): string => {
    if (v === 0) return "0";
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return `${v}`;
};

export function ProfitabilitySnapshotCard({ data, isLoading }: ProfitabilitySnapshotCardProps) {
    if (isLoading) {
        return (
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-1 border-b border-slate-50">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-2 flex-1 flex flex-col justify-center">
                    <Skeleton className="h-[120px] w-full rounded-md" />
                </CardContent>
            </Card>
        );
    }

    const chartData = (data || []).map((item) => ({
        ...item,
        monthLabel: item.month.toUpperCase(),
    }));

    const totalProfit = chartData.length > 0 ? chartData[chartData.length - 1].net_profit : 0;

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <TrendingUp className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Profitability Snapshot
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Last 3 months prorated performance
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="px-4 pt-3 pb-2 flex-1 flex flex-col justify-between">
                    <div className="text-center my-1">
                        <span className="text-2xl font-black text-slate-800 tracking-tight block truncate">
                            Rp {totalProfit.toLocaleString("id-ID")}
                        </span>
                    </div>
                    
                    <div className="flex-1 min-h-[120px] w-full my-1">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} barSize={14} barGap={4}>
                                    <XAxis 
                                        dataKey="monthLabel" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} 
                                        dy={5} 
                                    />
                                    <Tooltip
                                        cursor={{ fill: "#f8fafc" }}
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "6px",
                                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            padding: "4px 8px"
                                        }}
                                        formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                                    />
                                    <Bar dataKey="revenue" name="REV" fill="#e2e8f0" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                                    <Bar dataKey="net_profit" name="PROFIT" fill="#0033cc" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
                                No data available
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="px-4 py-2.5 mt-auto border-t border-slate-100 flex justify-end shrink-0">
                    <Link 
                        href="/management/profitability" 
                        className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5] flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                        View Details <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

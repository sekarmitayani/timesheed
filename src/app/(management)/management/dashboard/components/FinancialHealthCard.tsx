"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { DebouncedResponsiveContainer } from "@/components/charts/DebouncedResponsiveContainer";
import { FinancialHealthData } from "../hooks/useManagementDashboardData";

interface FinancialHealthCardProps {
    data: FinancialHealthData;
}

const CHART_COLORS = ["#4B7BEC", "#94A3B8", "#93C5FD", "#6366F1", "#A78BFA"];

const fmtCurrencyShort = (v: number): string => {
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
    return `Rp ${v.toLocaleString("id-ID")}`;
};

const fmtPct = (value: number, total: number): string => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
};

export function FinancialHealthCard({ data }: FinancialHealthCardProps) {
    const { costBreakdown, totalCost, plSummary } = data;

    // Prepare chart data — filter out zero values
    const chartData = costBreakdown
        .filter((item) => item.value > 0)
        .map((item, index) => ({
            name: item.label,
            value: item.value,
            color: CHART_COLORS[index % CHART_COLORS.length],
        }));

    return (
        <Card className="xl:col-span-2 bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <PieIcon className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Financial Health
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            P&L summary and cost breakdown
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pt-3 pb-3.5 flex-1">
                {chartData.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No financial data available yet.
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        {/* Left: Donut Chart + Legend */}
                        <div className="flex flex-col items-center gap-3 md:gap-4 md:w-[260px] shrink-0">
                            <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]">
                                <DebouncedResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="55%"
                                            outerRadius="85%"
                                            dataKey="value"
                                            strokeWidth={2}
                                            stroke="#fff"
                                        >
                                            {chartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </DebouncedResponsiveContainer>
                                {/* Center label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Total Cost
                                    </span>
                                    <span className="text-sm sm:text-lg font-black text-slate-800 tracking-tight">
                                        {fmtCurrencyShort(totalCost)}
                                    </span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-1.5 w-full">
                                {chartData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-slate-600 font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-slate-800 font-bold tabular-nums">
                                            {fmtCurrencyShort(item.value)}{" "}
                                            <span className="text-slate-400 font-medium">
                                                ({fmtPct(item.value, totalCost)})
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: P&L Summary */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                P&L Summary
                            </p>
                            <div className="space-y-3">
                                {plSummary.map((item) => (
                                    <div
                                        key={item.label}
                                        className={`flex items-center justify-between ${
                                            item.isBold ? "pt-3 border-t border-slate-100" : ""
                                        }`}
                                    >
                                        <span
                                            className={`text-sm ${
                                                item.isBold
                                                    ? "font-bold text-[#4B7BEC]"
                                                    : "font-medium text-slate-600"
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                        <span
                                            className={`text-sm tabular-nums ${
                                                item.isBold
                                                    ? "font-black text-[#4B7BEC]"
                                                    : item.isNegative
                                                    ? "font-bold text-red-500"
                                                    : "font-bold text-slate-800"
                                            }`}
                                        >
                                            {item.isNegative ? "- " : ""}
                                            {fmtCurrencyShort(Math.abs(item.value))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

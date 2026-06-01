"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CostDistributionItem } from "@/lib/services/management-service";

import { PieChart as PieChartIcon } from "lucide-react";

interface CostDistributionChartProps {
    data?: CostDistributionItem[];
    isLoading: boolean;
    totalExpenses: number;
}

export function CostDistributionChart({ data, isLoading, totalExpenses }: CostDistributionChartProps) {
    const COLORS = ["#4B7BEC", "#2568C1", "#8C1A11", "#475569", "#94A3B8"];

    const fmtCurrencyShort = (v: number) => {
        if (v >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
        if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-[400px]">
            <CardHeader className="pb-1 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-[#4B7BEC]" /> Expenditure Distribution
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 -mt-0.5">Cost breakdown by categories</p>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center p-6">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B7BEC]"></div>
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium">
                        No distribution data available
                    </div>
                ) : (
                    <div className="flex flex-col h-full relative">
                        <div className="h-[200px] relative w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any, name: any, props: any) => [
                                            `${Number(value).toFixed(1)}% (${fmtCurrencyShort(props.payload.amount)})`,
                                            name
                                        ]}
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "12px", fontWeight: "bold" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                <span className="text-lg font-black text-slate-800">{fmtCurrencyShort(totalExpenses)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-auto">
                            {data.map((item, index) => (
                                <div key={item.category} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-xs font-medium text-slate-600 truncate max-w-[80px]">{item.category}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">{item.value.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

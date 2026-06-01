"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CostTrendItem } from "@/lib/services/management-service";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

import { BarChart as BarChartIcon } from "lucide-react";

interface MonthlyCostTrendChartProps {
    data?: CostTrendItem[];
    isLoading: boolean;
}

export function MonthlyCostTrendChart({ data, isLoading }: MonthlyCostTrendChartProps) {
    const formatYAxis = (tickItem: number) => {
        if (tickItem === 0) return "0";
        if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(0)}M`;
        if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}K`;
        return tickItem.toString();
    };

    const fmtCurrency = (v: number) => {
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-[400px]">
            <CardHeader className="pb-1 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChartIcon className="h-4 w-4 text-[#4B7BEC]" /> Monthly Cost Trend
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 -mt-0.5">6-month historical data</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-6">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B7BEC]"></div>
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                        No trend data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                                tickFormatter={formatYAxis}
                            />
                            <Tooltip
                                cursor={{ fill: "#f8fafc" }}
                                formatter={(value: any) => [fmtCurrency(Number(value)), "Total Cost"]}
                                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "12px", fontWeight: "bold" }}
                            />
                            <Bar 
                                dataKey="cost" 
                                fill="#0f45a6" 
                                radius={[4, 4, 0, 0]} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DebouncedResponsiveContainer } from "@/components/charts/DebouncedResponsiveContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { MonthlyProfitChartData } from "../hooks/useProfitabilityData";

interface MonthlyProfitChartProps {
    data: MonthlyProfitChartData[];
    months?: number;
    setMonths?: (val: number) => void;
}

const fmtCurrencyShort = (v: number): string => {
    if (v === 0) return "0";
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return `${v}`;
};

export function MonthlyProfitChart({ data, months, setMonths }: MonthlyProfitChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="bg-white border border-slate-100 shadow-sm rounded-xl">
                <CardHeader className="pb-1 border-b border-slate-50">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#4B7BEC]" /> Monthly Profit Growth
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium ml-6 -mt-0.5">Historical prorated revenue and profit analysis</p>
                    </div>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium">No data available.</p>
                </CardContent>
            </Card>
        );
    }

    // Format data for chart
    const chartData = data.map((item) => ({
        ...item,
        monthLabel: item.month.toUpperCase(),
    }));

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0 min-w-0">
            <CardHeader className="px-5 py-4 border-b border-slate-100 [&.border-b]:pb-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <TrendingUp className="h-4 w-4 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            MONTHLY PROFIT GROWTH
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Historical prorated revenue and profit analysis
                        </p>
                    </div>
                </div>
                {setMonths && (
                    <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                        <SelectTrigger className="h-8 w-[110px] bg-white border-slate-200 shrink-0 text-xs shadow-xs">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Month</SelectItem>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </CardHeader>
            <CardContent className="px-5 py-4 min-w-0">
                <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full min-w-0" style={{ contain: "layout style paint" }}>
                    <DebouncedResponsiveContainer width="99%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                            barGap={2}
                            barSize={12}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="monthLabel"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }}
                                tickFormatter={fmtCurrencyShort}
                            />
                            <Tooltip
                                cursor={{ fill: "#f8fafc" }}
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                                formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="square"
                                iconSize={10}
                                wrapperStyle={{ paddingBottom: "20px", fontSize: "10px", fontWeight: 700, color: "#64748b" }}
                            />
                            <Bar dataKey="revenue" name="REVENUE" fill="#e2e8f0" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                            <Bar dataKey="expenses" name="EXPENSES" fill="#cbd5e1" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                            <Bar dataKey="net_profit" name="NET PROFIT" fill="#0033cc" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                    </DebouncedResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

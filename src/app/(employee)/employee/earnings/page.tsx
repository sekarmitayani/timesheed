"use client";

import { useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, PageHeader, RiskBadge, AIConfidence } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { mockPayments } from "@/lib/mock-data";
import { forecastEarnings } from "@/lib/ai/forecasting";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const earningsHistory = [
    { month: "Sep", amount: 12000000 },
    { month: "Oct", amount: 12500000 },
    { month: "Nov", amount: 13200000 },
    { month: "Dec", amount: 14000000 },
    { month: "Jan", amount: 13800000 },
    { month: "Feb", amount: 14500000 },
];

export default function EarningsPage() {
    const user = useAuthStore((s) => s.user);
    const myPayments = useMemo(() => mockPayments.filter((p) => p.userId === user?.id), [user]);
    const totalEarned = myPayments.filter((p) => p.status === "released").reduce((sum, p) => sum + p.amount, 0);
    const pending = myPayments.filter((p) => p.status === "pending" || p.status === "approved").reduce((sum, p) => sum + p.amount, 0);

    const forecast = useMemo(() => forecastEarnings(earningsHistory.map((e) => e.amount)), []);

    // Add forecast to chart data
    const chartData = [
        ...earningsHistory,
        { month: "Mar (AI)", amount: forecast.predictedValue },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Earnings" description="Your income summary and AI projections" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Earned" value={`Rp ${(totalEarned / 1000000).toFixed(0)}M`} subtitle="This year" icon={DollarSign} />
                <StatCard title="Pending Payment" value={`Rp ${(pending / 1000000).toFixed(0)}M`} subtitle="Awaiting release" icon={Calendar} />
                <StatCard title="Projected Monthly" value={`Rp ${(forecast.predictedValue / 1000000).toFixed(1)}M`} subtitle={`Growth: +${forecast.growthRate}%`} icon={TrendingUp} glow />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#FFBE18]" /> Earnings Trend + AI Forecast
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `Rp ${(Number(v) / 1000000).toFixed(1)}M`} />
                                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="url(#areaGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-[#FFBE18]/20">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#FFBE18]" /> AI Financial Insight
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                                <p className="text-xs text-muted-foreground">Yearly Estimate</p>
                                <p className="text-lg font-bold">Rp {((forecast.predictedValue * 12) / 1000000).toFixed(0)}M</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                                <p className="text-xs text-muted-foreground">Monthly Growth</p>
                                <p className="text-lg font-bold text-emerald-500">+{forecast.growthRate}%</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <RiskBadge level={forecast.riskLevel} />
                            <AIConfidence confidence={forecast.confidence} />
                        </div>
                        <p className="text-xs text-muted-foreground">Based on 6-month linear projection with moving average smoothing.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {myPayments.map((pay) => (
                            <div key={pay.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Rp {(pay.amount / 1000000).toFixed(0)}M</p>
                                    <p className="text-xs text-muted-foreground">Period: {pay.period}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${pay.status === "released" ? "bg-emerald-500/10 text-emerald-500" :
                                    pay.status === "approved" ? "bg-blue-500/10 text-blue-500" :
                                        "bg-amber-500/10 text-amber-500"
                                    }`}>
                                    {pay.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

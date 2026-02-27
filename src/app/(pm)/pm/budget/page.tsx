"use client";

import { useMemo } from "react";
import { DollarSign, TrendingUp, AlertTriangle, Sparkles, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard, PageHeader, RiskBadge, AIConfidence, AISuggestionCard } from "@/components/ai/ai-components";
import { mockProjects, budgetTrendData } from "@/lib/mock-data";
import { forecastBudget } from "@/lib/ai/forecasting";
import { detectBudgetAnomaly } from "@/lib/ai/anomaly";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function BudgetPage() {
    const activeProjects = mockProjects.filter((p) => p.status === "active");
    const totalBudget = activeProjects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = activeProjects.reduce((s, p) => s + p.spent, 0);

    const forecast = useMemo(() => forecastBudget(
        budgetTrendData.filter((d) => d.actual).map((d) => d.actual as number),
        totalBudget
    ), [totalBudget]);

    const budgetAnomaly = useMemo(() => detectBudgetAnomaly(
        budgetTrendData[5]?.actual as number || 0,
        budgetTrendData[4]?.actual as number || 0,
        totalBudget
    ), [totalBudget]);

    return (
        <div className="space-y-6">
            <PageHeader title="Budget Monitor" description="Track budget utilization with AI forecasting" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Budget" value={`Rp ${(totalBudget / 1000000000).toFixed(2)}B`} icon={DollarSign} />
                <StatCard title="Total Spent" value={`Rp ${(totalSpent / 1000000000).toFixed(2)}B`} subtitle={`${((totalSpent / totalBudget) * 100).toFixed(0)}% utilized`} icon={TrendingUp} />
                <StatCard title="Predicted Overspend" value={forecast.predictedDate || "N/A"} subtitle="Budget exhaustion date" icon={Calendar} glow={forecast.riskLevel === "high"} />
                <StatCard title="Growth Rate" value={`${forecast.growthRate}%`} subtitle="Monthly spending growth" icon={AlertTriangle} />
            </div>

            {budgetAnomaly.riskScore > 0 && (
                <AISuggestionCard suggestions={budgetAnomaly.reasons} title="AI Budget Alert" />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#FFBE18]" /> Burn Rate Forecast
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={budgetTrendData}>
                            <defs>
                                <linearGradient id="budgetActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="budgetProj" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `Rp ${(Number(v) / 1000000).toFixed(0)}M`} />
                            <Legend />
                            <Area type="monotone" dataKey="actual" name="Actual Spend" stroke="#8b5cf6" fill="url(#budgetActual)" strokeWidth={2} connectNulls={false} />
                            <Area type="monotone" dataKey="projected" name="AI Projected" stroke="#f59e0b" fill="url(#budgetProj)" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-3 flex items-center justify-between">
                        <AIConfidence confidence={forecast.confidence} />
                        <RiskBadge level={forecast.riskLevel} />
                    </div>
                </CardContent>
            </Card>

            {/* Per-Project Budget */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Per-Project Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeProjects.map((project) => {
                        const pct = (project.spent / project.budget) * 100;
                        return (
                            <div key={project.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium">{project.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            Rp {(project.spent / 1000000).toFixed(0)}M / {(project.budget / 1000000).toFixed(0)}M
                                        </span>
                                    </div>
                                    {pct > 80 && <RiskBadge level={pct > 90 ? "high" : "medium"} />}
                                </div>
                                <Progress value={pct} className="h-2" />
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

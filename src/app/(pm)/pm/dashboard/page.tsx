"use client";

import { useMemo } from "react";
import { FolderKanban, Users, DollarSign, AlertTriangle, TrendingUp, Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard, PageHeader, RiskBadge, AISuggestionCard } from "@/components/ai/ai-components";
import { mockProjects, mockTimesheets, mockTasks, mockUsers, budgetTrendData } from "@/lib/mock-data";
import { predictTeamWorkload, getRedistributionSuggestions } from "@/lib/ai/workload";
import { forecastBudget } from "@/lib/ai/forecasting";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PMDashboard() {
    const activeProjects = mockProjects.filter((p) => p.status === "active");
    const team = mockUsers.filter((u) => u.role === "employee");
    const totalBudget = activeProjects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = activeProjects.reduce((s, p) => s + p.spent, 0);

    const teamWorkloads = useMemo(() => predictTeamWorkload(team, mockTasks, mockTimesheets, mockProjects), []);
    const suggestions = useMemo(() => getRedistributionSuggestions(teamWorkloads), [teamWorkloads]);
    const overloaded = teamWorkloads.filter((tw) => tw.workload.status === "overloaded").length;
    const burnoutRisk = teamWorkloads.filter((tw) => tw.workload.burnoutRisk === "high").length;

    return (
        <div className="space-y-6">
            <PageHeader title="Project Dashboard" description="Overview of your projects and team performance" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Active Projects" value={activeProjects.length} subtitle={`${mockProjects.filter((p) => p.status === "completed").length} completed`} icon={FolderKanban} />
                <StatCard title="Team Members" value={team.length} subtitle={`${overloaded} overloaded`} icon={Users} />
                <StatCard title="Total Budget" value={`Rp ${(totalBudget / 1000000000).toFixed(1)}B`} subtitle={`${((totalSpent / totalBudget) * 100).toFixed(0)}% utilized`} icon={DollarSign} />
                <StatCard title="Burnout Risk" value={burnoutRisk} subtitle="employees at risk" icon={AlertTriangle} glow={burnoutRisk > 0} />
            </div>

            {suggestions.length > 0 && <AISuggestionCard suggestions={suggestions} title="AI Workload Recommendations" />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#FFBE18]" /> Budget vs Projected Spend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={budgetTrendData}>
                                <defs>
                                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                <Area type="monotone" dataKey="actual" name="Actual" stroke="#8b5cf6" fill="url(#actualGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="projected" name="Projected" stroke="#f59e0b" fill="url(#projGrad)" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Projects Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Project Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeProjects.map((project) => {
                            const budgetPct = (project.spent / project.budget) * 100;
                            const mandaysPct = (project.usedMandays / project.totalMandays) * 100;
                            return (
                                <div key={project.id} className="p-3 rounded-lg bg-muted/30 space-y-2 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium">{project.name}</h4>
                                            <p className="text-xs text-muted-foreground">{project.client}</p>
                                        </div>
                                        {budgetPct > 80 && <RiskBadge level={budgetPct > 90 ? "high" : "medium"} />}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>Budget</span>
                                                <span>{budgetPct.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={budgetPct} className="h-1.5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>Mandays</span>
                                                <span>{mandaysPct.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={mandaysPct} className="h-1.5" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

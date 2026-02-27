"use client";

import { useMemo } from "react";
import { Brain, Users, AlertTriangle, Zap, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard, PageHeader, WorkloadBadge, RiskBadge, AISuggestionCard, AIConfidence } from "@/components/ai/ai-components";
import { mockUsers, mockTasks, mockTimesheets, mockProjects, workloadHeatmapData } from "@/lib/mock-data";
import { predictTeamWorkload, getRedistributionSuggestions } from "@/lib/ai/workload";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { cn } from "@/lib/utils";

export default function WorkloadPage() {
    const team = mockUsers.filter((u) => u.role === "employee");
    const teamWorkloads = useMemo(() => predictTeamWorkload(team, mockTasks, mockTimesheets, mockProjects), []);
    const suggestions = useMemo(() => getRedistributionSuggestions(teamWorkloads), [teamWorkloads]);

    const overloaded = teamWorkloads.filter((tw) => tw.workload.status === "overloaded");
    const balanced = teamWorkloads.filter((tw) => tw.workload.status === "balanced");
    const underutilized = teamWorkloads.filter((tw) => tw.workload.status === "underutilized");
    const burnoutHigh = teamWorkloads.filter((tw) => tw.workload.burnoutRisk === "high");

    // Chart data
    const workloadScoreData = teamWorkloads.map((tw) => ({
        name: tw.user.name.split(" ")[0],
        score: tw.workload.workloadScore,
        predicted: tw.workload.predictedNextWeekHours,
    }));

    const distributionData = [
        { name: "Overloaded", value: overloaded.length, color: "#ef4444" },
        { name: "Balanced", value: balanced.length, color: "#10b981" },
        { name: "Underutilized", value: underutilized.length, color: "#3b82f6" },
    ];

    const getBarColor = (score: number) => score >= 76 ? "#ef4444" : score >= 41 ? "#10b981" : "#3b82f6";

    return (
        <div className="space-y-6">
            <PageHeader title="Workload AI Dashboard" description="Predictive workload analysis and team balancing recommendations">
                <Badge variant="outline" className="gap-1 bg-gradient-to-r from-[#FFBE18]/10 to-[#E5A800]/10 text-[#FFBE18] border-[#FFBE18]/20">
                    <Brain className="h-3 w-3" /> AI Powered
                </Badge>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Overloaded" value={overloaded.length} subtitle="employees" icon={AlertTriangle} glow={overloaded.length > 0} />
                <StatCard title="Balanced" value={balanced.length} subtitle="employees" icon={Activity} />
                <StatCard title="Underutilized" value={underutilized.length} subtitle="employees" icon={Zap} />
                <StatCard title="Burnout Risk" value={burnoutHigh.length} subtitle="high risk" icon={AlertTriangle} glow={burnoutHigh.length > 0} />
            </div>

            {suggestions.length > 0 && <AISuggestionCard suggestions={suggestions} title="AI Smart Recommendations" />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workload Score Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Brain className="h-4 w-4 text-[#FFBE18]" /> Workload Score by Team Member
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={workloadScoreData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Workload">
                                    {workloadScoreData.map((entry, index) => (
                                        <Cell key={index} fill={getBarColor(entry.score)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Heatmap */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[#FFBE18]" /> Weekly Hours Heatmap
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr>
                                        <th className="text-left py-2 text-muted-foreground font-medium">Name</th>
                                        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                                            <th key={d} className="text-center py-2 text-muted-foreground font-medium w-12">{d}</th>
                                        ))}
                                        <th className="text-center py-2 text-muted-foreground font-medium">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workloadHeatmapData.map((row) => (
                                        <tr key={row.name}>
                                            <td className="py-1.5 font-medium">{row.name.split(" ")[0]}</td>
                                            {[row.mon, row.tue, row.wed, row.thu, row.fri].map((hours, i) => (
                                                <td key={i} className="text-center py-1.5">
                                                    <div className={cn(
                                                        "mx-auto h-8 w-10 rounded-md flex items-center justify-center font-medium text-white text-[11px]",
                                                        hours >= 10 ? "bg-red-500" : hours >= 8 ? "bg-amber-500" : hours >= 6 ? "bg-emerald-500" : "bg-blue-500"
                                                    )}>
                                                        {hours}h
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="text-center py-1.5">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px]",
                                                    row.score >= 76 ? "text-red-500 border-red-500/20" :
                                                        row.score >= 41 ? "text-emerald-500 border-emerald-500/20" :
                                                            "text-blue-500 border-blue-500/20"
                                                )}>
                                                    {row.score}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamWorkloads.map(({ user, workload }) => (
                    <Card key={user.id} className={cn(
                        "transition-all",
                        workload.status === "overloaded" && "border-red-500/30 shadow-[0_0_15px_rgba(0,0,0,0.06)]"
                    )}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium">{user.name}</h4>
                                    <p className="text-xs text-muted-foreground">{user.position}</p>
                                </div>
                                <WorkloadBadge workload={workload} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Workload Score</span>
                                    <span>{workload.workloadScore}%</span>
                                </div>
                                <Progress value={workload.workloadScore} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-muted/30">
                                    <span className="text-muted-foreground">Burnout Risk</span>
                                    <div className="mt-1"><RiskBadge level={workload.burnoutRisk} /></div>
                                </div>
                                <div className="p-2 rounded bg-muted/30">
                                    <span className="text-muted-foreground">Next Week</span>
                                    <p className="font-medium mt-1">{workload.predictedNextWeekHours}h predicted</p>
                                </div>
                            </div>
                            <AIConfidence confidence={workload.aiConfidence} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

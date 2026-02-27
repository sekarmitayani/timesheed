"use client";

import { useMemo } from "react";
import { Brain, AlertTriangle, Users, ShieldAlert, Eye, Sparkles, Activity, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { StatCard, PageHeader, RiskBadge, AIConfidence } from "@/components/ai/ai-components";
import { useAIStore } from "@/store/useAIStore";
import { mockUsers, mockTasks, mockTimesheets, mockProjects } from "@/lib/mock-data";
import { predictTeamWorkload } from "@/lib/ai/workload";
import { detectAnomaly } from "@/lib/ai/anomaly";
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export default function AIMonitoringPage() {
    const { strictMode, toggleStrictMode, totalAnomalies, totalOverloaded, burnoutRiskCount, overallConfidence } = useAIStore();

    const employees = mockUsers.filter((u) => u.role === "employee");
    const teamWorkloads = useMemo(() => predictTeamWorkload(employees, mockTasks, mockTimesheets, mockProjects), []);

    const anomalyEntries = useMemo(() => {
        return mockTimesheets.map((ts) => ({ ...ts, anomaly: detectAnomaly(ts) })).filter((e) => e.anomaly.riskScore > 0);
    }, []);

    const riskDistribution = [
        { name: "High Risk", value: anomalyEntries.filter((e) => e.anomaly.riskLevel === "high").length, color: "#ef4444" },
        { name: "Medium Risk", value: anomalyEntries.filter((e) => e.anomaly.riskLevel === "medium").length, color: "#f59e0b" },
        { name: "Low Risk", value: anomalyEntries.filter((e) => e.anomaly.riskLevel === "low").length, color: "#10b981" },
    ];

    const workloadDistribution = [
        { name: "Overloaded", value: teamWorkloads.filter((tw) => tw.workload.status === "overloaded").length, color: "#ef4444" },
        { name: "Balanced", value: teamWorkloads.filter((tw) => tw.workload.status === "balanced").length, color: "#10b981" },
        { name: "Underutilized", value: teamWorkloads.filter((tw) => tw.workload.status === "underutilized").length, color: "#3b82f6" },
    ];

    const accuracyData = [
        { module: "Anomaly", accuracy: 92, confidence: 88 },
        { module: "Forecast", accuracy: 85, confidence: 82 },
        { module: "Face AI", accuracy: 95, confidence: 91 },
        { module: "Workload", accuracy: 88, confidence: 85 },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="AI Monitoring Center" description="Central dashboard for all AI modules">
                <div className="flex items-center gap-3 p-2 px-4 rounded-lg border bg-card">
                    <span className="text-xs font-medium">AI Strict Mode</span>
                    <Switch checked={strictMode} onCheckedChange={toggleStrictMode} />
                    <Badge variant={strictMode ? "destructive" : "secondary"} className="text-[10px]">
                        {strictMode ? "STRICT" : "NORMAL"}
                    </Badge>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Anomalies" value={anomalyEntries.length} subtitle="detected this period" icon={AlertTriangle} glow />
                <StatCard title="Overloaded" value={teamWorkloads.filter((tw) => tw.workload.status === "overloaded").length} subtitle="employees" icon={Users} />
                <StatCard title="Burnout Risk" value={teamWorkloads.filter((tw) => tw.workload.burnoutRisk === "high").length} subtitle="high risk" icon={ShieldAlert} glow={teamWorkloads.filter((tw) => tw.workload.burnoutRisk === "high").length > 0} />
                <StatCard title="AI Confidence" value={`${overallConfidence}%`} subtitle="overall score" icon={Brain} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[#FFBE18]" /> Workload Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={workloadDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {workloadDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" /> AI Module Accuracy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={accuracyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="module" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                <Bar dataKey="accuracy" name="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="confidence" name="Confidence" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Anomaly Log */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4 text-[#FFBE18]" /> Anomaly Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {anomalyEntries.slice(0, 8).map((entry) => {
                        const user = mockUsers.find((u) => u.id === entry.userId);
                        return (
                            <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <RiskBadge level={entry.anomaly.riskLevel} score={entry.anomaly.riskScore} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{user?.name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{entry.anomaly.reasons[0]}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{entry.date}</span>
                                <AIConfidence confidence={entry.anomaly.aiConfidence} />
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

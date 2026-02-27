"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, ListTodo, FileText, TrendingUp, AlertTriangle, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard, PageHeader, RiskBadge, AIInsightPanel, AIConfidence } from "@/components/ai/ai-components";
import { getPriorityBadgeClasses } from "@/lib/priority-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { mockTimesheets, mockTasks, mockProjects, mockAttendance, weeklyHoursData } from "@/lib/mock-data";
import { detectAnomaly, detectWeeklyAnomaly } from "@/lib/ai/anomaly";
import { forecastEarnings } from "@/lib/ai/forecasting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

export default function EmployeeDashboard() {
    const user = useAuthStore((s) => s.user);

    const myTimesheets = useMemo(() => mockTimesheets.filter((t) => t.userId === user?.id), [user]);
    const myTasks = useMemo(() => mockTasks.filter((t) => t.assigneeId === user?.id), [user]);
    const todayAttendance = useMemo(() => mockAttendance.find((a) => a.userId === user?.id && a.date === "2026-02-19"), [user]);

    const todayHours = myTimesheets.find((t) => t.date === "2026-02-19")?.hours || 0;
    const weekHours = myTimesheets.slice(0, 5).reduce((sum, t) => sum + t.hours, 0);
    const activeTasks = myTasks.filter((t) => t.status !== "done").length;
    const pendingApprovals = myTimesheets.filter((t) => t.status === "submitted").length;

    // AI Analysis
    const anomalies = useMemo(() => myTimesheets.map((ts) => ({ entry: ts, anomaly: detectAnomaly(ts) })).filter((r) => r.anomaly.riskScore > 0), [myTimesheets]);
    const weeklyAnomaly = useMemo(() => detectWeeklyAnomaly(weekHours, 38), [weekHours]);
    const earningsForecast = useMemo(() => forecastEarnings([12000000, 12500000, 13200000, 14000000, 13800000, 14500000]), []);

    const highRiskEntries = anomalies.filter((a) => a.anomaly.riskLevel === "high");

    return (
        <div className="space-y-6">
            <PageHeader title="Dashboard" description={`Welcome back, ${user?.name}. Here's your overview for today.`} />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Today's Hours" value={`${todayHours}h`} subtitle={todayAttendance ? `${todayAttendance.clockIn} - ${todayAttendance.clockOut}` : "Not clocked in"} icon={Clock} />
                <StatCard title="This Week" value={`${weekHours}h`} subtitle="Target: 40h" trend={weekHours > 40 ? `${weekHours - 40}h overtime` : `${40 - weekHours}h remaining`} trendUp={weekHours <= 40} icon={Calendar} />
                <StatCard title="Active Tasks" value={activeTasks} subtitle={`${myTasks.filter((t) => t.status === "done").length} completed`} icon={ListTodo} />
                <StatCard title="Pending Approval" value={pendingApprovals} subtitle="Timesheet submissions" icon={FileText} />
            </div>

            {/* AI Risk Alert */}
            {highRiskEntries.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <AIInsightPanel anomaly={highRiskEntries[0].anomaly} title="AI Alert: High Risk Detected on Your Timesheet" />
                </motion.div>
            )}

            {weeklyAnomaly.riskScore > 0 && (
                <AIInsightPanel anomaly={weeklyAnomaly} title="AI Weekly Pattern Analysis" />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Hours Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#FFBE18]" /> Weekly Hours Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={weeklyHoursData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                                <ReferenceLine y={40} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Target", position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                                <Bar dataKey="hours" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Earning Forecast */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#FFBE18]" /> AI Earnings Forecast
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Projected Monthly</p>
                                <p className="text-xl font-bold">Rp {(earningsForecast.predictedValue / 1000000).toFixed(1)}M</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Growth Rate</p>
                                <p className="text-xl font-bold text-emerald-500">+{earningsForecast.growthRate}%</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Yearly Estimate</p>
                                <p className="text-lg font-semibold">Rp {((earningsForecast.predictedValue * 12) / 1000000).toFixed(0)}M</p>
                            </div>
                            <div className="space-y-1">
                                <RiskBadge level={earningsForecast.riskLevel} />
                            </div>
                        </div>
                        <AIConfidence confidence={earningsForecast.confidence} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tasks */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">My Active Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {myTasks.filter((t) => t.status !== "done").slice(0, 5).map((task) => {
                            const project = mockProjects.find((p) => p.id === task.projectId);
                            const progress = task.estimatedHours > 0 ? (task.loggedHours / task.estimatedHours) * 100 : 0;
                            return (
                                <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">{task.title}</span>
                                            <Badge variant="outline" className={`text-[10px] shrink-0 ${getPriorityBadgeClasses(task.priority)}`}>
                                                {task.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{project?.name} • Due {task.dueDate}</p>
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Progress value={progress} className="h-1.5" />
                                        <p className="text-[10px] text-muted-foreground text-right">{task.loggedHours}/{task.estimatedHours}h</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { DollarSign, TrendingUp, Users, FolderKanban, BarChart3, PieChart as PieIcon, Sparkles, AlertTriangle, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, PageHeader, RiskBadge } from "@/components/ai/ai-components";
import { mockProjects, mockUsers } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";

const revenueData = [
    { month: "Sep", revenue: 850, cost: 600, profit: 250 },
    { month: "Oct", revenue: 920, cost: 650, profit: 270 },
    { month: "Nov", revenue: 1050, cost: 720, profit: 330 },
    { month: "Dec", revenue: 980, cost: 700, profit: 280 },
    { month: "Jan", revenue: 1120, cost: 780, profit: 340 },
    { month: "Feb", revenue: 1200, cost: 820, profit: 380 },
];

const kpiData = [
    { name: "Revenue Growth", value: "+12.5%", trend: "up", color: "text-emerald-500" },
    { name: "Profit Margin", value: "31.7%", trend: "up", color: "text-emerald-500" },
    { name: "Cost Efficiency", value: "68.3%", trend: "down", color: "text-amber-500" },
    { name: "Resource Util.", value: "78%", trend: "up", color: "text-emerald-500" },
];

const projectHealth = [
    { name: "On Track", value: 3, color: "#10b981" },
    { name: "At Risk", value: 1, color: "#f59e0b" },
    { name: "Behind", value: 1, color: "#ef4444" },
];

export default function ExecutiveDashboard() {
    const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
    const totalProfit = revenueData.reduce((s, d) => s + d.profit, 0);
    const activeProjects = mockProjects.filter((p) => p.status === "active");
    const totalBudget = activeProjects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = activeProjects.reduce((s, p) => s + p.spent, 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Executive Dashboard" description="Organization-wide KPIs and financial overview">
                <Badge variant="outline" className="gap-1 bg-gradient-to-r from-[#FFBE18]/10 to-[#E5A800]/10 text-[#FFBE18] border-[#FFBE18]/20">
                    <Sparkles className="h-3 w-3" /> AI Insights Active
                </Badge>
            </PageHeader>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi) => (
                    <Card key={kpi.name} className="hover:border-[#FFBE18]/20 transition-colors">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">{kpi.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl font-bold">{kpi.value}</span>
                                {kpi.trend === "up" ? <ArrowUpRight className={`h-4 w-4 ${kpi.color}`} /> : <ArrowDownRight className={`h-4 w-4 ${kpi.color}`} />}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Revenue" value={`Rp ${(totalRevenue / 1000).toFixed(1)}B`} subtitle="This period" icon={DollarSign} />
                <StatCard title="Net Profit" value={`Rp ${(totalProfit / 1000).toFixed(1)}B`} subtitle={`${((totalProfit / totalRevenue) * 100).toFixed(0)}% margin`} icon={TrendingUp} />
                <StatCard title="Budget Utilization" value={`${((totalSpent / totalBudget) * 100).toFixed(0)}%`} subtitle={`Rp ${(totalSpent / 1000000000).toFixed(1)}B spent`} icon={Target} />
                <StatCard title="Active Staff" value={mockUsers.filter((u) => u.status === "active").length} subtitle={`${mockUsers.length} total`} icon={Users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue vs Cost Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-[#FFBE18]" /> Revenue vs Cost Trend (in Millions)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}M`} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `Rp ${v}M`} />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="cost" name="Cost" stroke="#ef4444" fill="url(#costGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="profit" name="Profit" stroke="#8b5cf6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Project Health */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <PieIcon className="h-4 w-4 text-[#FFBE18]" /> Project Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={projectHealth} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {projectHealth.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-2">
                            {projectHealth.map((ph) => (
                                <div key={ph.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ background: ph.color }} />
                                        <span>{ph.name}</span>
                                    </div>
                                    <span className="font-medium">{ph.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

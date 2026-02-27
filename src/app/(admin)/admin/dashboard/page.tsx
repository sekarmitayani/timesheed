"use client";

import { Users, FolderKanban, CreditCard, Shield, AlertTriangle, Activity, Sparkles, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, PageHeader, RiskBadge } from "@/components/ai/ai-components";
import { mockUsers, mockProjects, mockContracts, mockAuditLogs, mockPayments } from "@/lib/mock-data";
import { useAIStore } from "@/store/useAIStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const userRoleData = [
    { name: "Employee", value: 6, color: "#3b82f6" },
    { name: "PM", value: 2, color: "#8b5cf6" },
    { name: "Admin", value: 1, color: "#f59e0b" },
    { name: "Management", value: 1, color: "#10b981" },
];

export default function AdminDashboard() {
    const { totalAnomalies, totalOverloaded, burnoutRiskCount, overallConfidence } = useAIStore();

    return (
        <div className="space-y-6">
            <PageHeader title="Admin Dashboard" description="System overview and management" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={mockUsers.length} subtitle={`${mockUsers.filter((u) => u.status === "active").length} active`} icon={Users} />
                <StatCard title="Active Projects" value={mockProjects.filter((p) => p.status === "active").length} icon={FolderKanban} />
                <StatCard title="Pending Payments" value={mockPayments.filter((p) => p.status === "pending").length} icon={CreditCard} />
                <StatCard title="AI Anomalies" value={totalAnomalies} subtitle={`${overallConfidence}% confidence`} icon={Brain} glow />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm">User Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {userRoleData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {mockAuditLogs.slice(0, 5).map((log) => {
                            const user = mockUsers.find((u) => u.id === log.userId);
                            return (
                                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-xs">
                                    <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium">{user?.name}</span>
                                        <span className="text-muted-foreground ml-1">{log.action.toLowerCase().replace(/_/g, " ")}</span>
                                    </div>
                                    <span className="text-muted-foreground shrink-0">{new Date(log.timestamp).toLocaleDateString()}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

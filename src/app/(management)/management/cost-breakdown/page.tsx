"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ai/ai-components";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const costBreakdown = [
    { name: "Salaries", value: 45, color: "#8b5cf6" },
    { name: "Freelancer", value: 20, color: "#3b82f6" },
    { name: "Infrastructure", value: 15, color: "#10b981" },
    { name: "Licenses", value: 10, color: "#f59e0b" },
    { name: "Overhead", value: 10, color: "#6b7280" },
];

const monthlyCost = [
    { month: "Sep", salary: 400, freelancer: 120, infra: 80 },
    { month: "Oct", salary: 420, freelancer: 130, infra: 85 },
    { month: "Nov", salary: 420, freelancer: 150, infra: 90 },
    { month: "Dec", salary: 430, freelancer: 140, infra: 88 },
    { month: "Jan", salary: 440, freelancer: 160, infra: 92 },
    { month: "Feb", salary: 450, freelancer: 155, infra: 95 },
];

export default function CostBreakdownPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Cost Breakdown" description="Detailed analysis of organizational costs" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm">Cost Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                    {costBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm">Monthly Cost Trend (in Millions)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={monthlyCost}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}M`} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                <Bar dataKey="salary" name="Salary" fill="#8b5cf6" stackId="a" />
                                <Bar dataKey="freelancer" name="Freelancer" fill="#3b82f6" stackId="a" />
                                <Bar dataKey="infra" name="Infrastructure" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

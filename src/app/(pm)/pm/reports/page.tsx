"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ai/ai-components";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const taskDistribution = [
    { name: "Completed", value: 24, color: "#10b981" },
    { name: "In Progress", value: 18, color: "#8b5cf6" },
    { name: "To Do", value: 8, color: "#6b7280" },
    { name: "Overdue", value: 3, color: "#ef4444" },
];

const weeklyProgress = [
    { week: "W1", completed: 5, added: 7 },
    { week: "W2", completed: 8, added: 4 },
    { week: "W3", completed: 6, added: 6 },
    { week: "W4", completed: 9, added: 5 },
];

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Reports" description="Project reports and analytics" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm">Task Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                    {taskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm">Weekly Progress</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={weeklyProgress}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="added" name="New Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

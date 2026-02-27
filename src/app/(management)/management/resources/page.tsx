"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatCard } from "@/components/ai/ai-components";
import { mockUsers, mockProjects } from "@/lib/mock-data";
import { Users, Target, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const utilData = mockUsers.filter((u) => u.role === "employee").map((u) => ({
    name: u.name.split(" ")[0],
    allocated: Math.floor(Math.random() * 40 + 60),
    actual: Math.floor(Math.random() * 40 + 50),
}));

export default function ResourcesPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Resource Utilization" description="Employee allocation and utilization metrics" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Staff" value={mockUsers.filter((u) => u.role === "employee").length} icon={Users} />
                <StatCard title="Avg Utilization" value="76%" subtitle="target: 80%" icon={Target} />
                <StatCard title="Active Projects" value={mockProjects.filter((p) => p.status === "active").length} icon={Activity} />
            </div>
            <Card>
                <CardHeader><CardTitle className="text-sm">Allocation vs Actual Utilization (%)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={utilData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                            <Legend />
                            <Bar dataKey="allocated" name="Allocated" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, RiskBadge, StatCard } from "@/components/ai/ai-components";
import { mockProjects } from "@/lib/mock-data";
import { DollarSign, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

export default function ProfitabilityPage() {
    const projectProfit = mockProjects.map((p) => ({
        name: p.name.split(" ").slice(0, 2).join(" "),
        revenue: (p.budget * 1.15) / 1000000,
        cost: p.spent / 1000000,
        margin: (((p.budget * 1.15 - p.spent) / (p.budget * 1.15)) * 100),
    }));

    return (
        <div className="space-y-6">
            <PageHeader title="Project Profitability" description="Revenue and margin analysis per project" />
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#FFBE18]" /> Revenue vs Cost by Project (in Millions)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={projectProfit}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}M`} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `Rp ${Number(v).toFixed(0)}M`} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectProfit.map((p) => (
                    <Card key={p.name}>
                        <CardContent className="p-4 space-y-2">
                            <h4 className="text-sm font-medium">{p.name}</h4>
                            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Profit Margin</span><span className={p.margin > 20 ? "text-emerald-500" : "text-amber-500"}>{p.margin.toFixed(1)}%</span></div>
                            <Progress value={p.margin} className="h-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

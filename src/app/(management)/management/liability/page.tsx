"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatCard, RiskBadge } from "@/components/ai/ai-components";
import { mockProjects, mockPayments } from "@/lib/mock-data";
import { DollarSign, AlertTriangle, Calendar } from "lucide-react";

export default function LiabilityPage() {
    const pendingPayments = mockPayments.filter((p) => p.status !== "released");
    const totalLiability = pendingPayments.reduce((s, p) => s + p.amount, 0);
    const projectLiabilities = mockProjects.filter((p) => p.status === "active").map((p) => ({
        name: p.name,
        remaining: p.budget - p.spent,
        pctSpent: (p.spent / p.budget) * 100,
    }));

    return (
        <div className="space-y-6">
            <PageHeader title="Liability Monitor" description="Track outstanding financial obligations" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Liability" value={`Rp ${(totalLiability / 1000000).toFixed(0)}M`} icon={DollarSign} glow />
                <StatCard title="Pending Payments" value={pendingPayments.length} subtitle="awaiting release" icon={Calendar} />
                <StatCard title="At-Risk Budgets" value={projectLiabilities.filter((p) => p.pctSpent > 80).length} subtitle="projects >80% spent" icon={AlertTriangle} />
            </div>
            <Card>
                <CardHeader><CardTitle className="text-sm">Project Budget Remaining</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {projectLiabilities.map((p) => (
                        <div key={p.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{p.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Rp {(p.remaining / 1000000).toFixed(0)}M remaining</span>
                                    {p.pctSpent > 80 && <RiskBadge level={p.pctSpent > 90 ? "high" : "medium"} />}
                                </div>
                            </div>
                            <Progress value={p.pctSpent} className="h-2" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

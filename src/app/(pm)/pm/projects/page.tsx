"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, RiskBadge } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500",
    completed: "bg-blue-500/10 text-blue-500",
    "on-hold": "bg-amber-500/10 text-amber-500",
    cancelled: "bg-red-500/10 text-red-500",
};

export default function PMProjectsPage() {
    const projects = useDataStore((s) => s.projects);
    const updateProject = useDataStore((s) => s.updateProject);

    const toggleStatus = (id: string, current: string) => {
        const next = current === "active" ? "on-hold" : current === "on-hold" ? "active" : current;
        updateProject(id, { status: next as any });
        toast.success(`Project status changed to ${next}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Projects" description="All projects under your management" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => {
                    const budgetPct = (p.spent / p.budget) * 100;
                    const mandaysPct = (p.usedMandays / p.totalMandays) * 100;
                    return (
                        <Card key={p.id} className="hover:border-[#FFBE18]/30 transition-colors">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium">{p.name}</h3>
                                        <p className="text-xs text-muted-foreground">{p.client} • {p.members.length} members</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => toggleStatus(p.id, p.status)}>
                                        <Badge variant="outline" className={`text-[10px] ${statusColors[p.status]} border-0`}>{p.status}</Badge>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground"><span>Budget</span><span>Rp {(p.spent / 1000000).toFixed(0)}M / {(p.budget / 1000000).toFixed(0)}M</span></div>
                                        <Progress value={budgetPct} className="h-1.5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground"><span>Mandays</span><span>{p.usedMandays} / {p.totalMandays}</span></div>
                                        <Progress value={mandaysPct} className="h-1.5" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{p.startDate} → {p.endDate}</span>
                                    {budgetPct > 85 && <RiskBadge level="high" />}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

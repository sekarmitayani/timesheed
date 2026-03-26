"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ai/ai-components";
import { cn } from "@/lib/utils";
import { mockMilestones, mockProjects } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
    pending: "bg-slate-50 text-slate-700 border-none",
    "in-progress": "bg-blue-50 text-blue-700 border-none",
    completed: "bg-emerald-50 text-emerald-700 border-none",
    overdue: "bg-red-50 text-red-700 border-none",
};
const statusDotColors: Record<string, string> = {
    pending: "bg-slate-500",
    "in-progress": "bg-blue-500",
    completed: "bg-emerald-500",
    overdue: "bg-red-500",
};

export default function MilestonesPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Milestones" description="Track project milestones and deliverables" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockMilestones.map((m) => {
                    const project = mockProjects.find((p) => p.id === m.projectId);
                    return (
                        <Card key={m.id} className={m.status === "overdue" ? "border-red-500/30" : ""}>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-sm">{m.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{project?.name}</p>
                                    </div>
                                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider", statusColors[m.status])}><div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[m.status])} /><span className="uppercase">{m.status}</span></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{m.progress}%</span>
                                    </div>
                                    <Progress value={m.progress} className="h-2" />
                                </div>
                                <p className="text-xs text-muted-foreground">Due: {m.dueDate}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

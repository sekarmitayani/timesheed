"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ai/ai-components";
import { mockMilestones, mockProjects } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
    pending: "bg-gray-500/10 text-gray-500",
    "in-progress": "bg-blue-500/10 text-blue-500",
    completed: "bg-emerald-500/10 text-emerald-500",
    overdue: "bg-red-500/10 text-red-500",
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
                                    <Badge variant="outline" className={`text-[10px] ${statusColors[m.status]}`}>{m.status}</Badge>
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

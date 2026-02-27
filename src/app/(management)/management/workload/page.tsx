"use client";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, WorkloadBadge, RiskBadge, StatCard, AISuggestionCard } from "@/components/ai/ai-components";
import { mockUsers, mockTasks, mockTimesheets, mockProjects } from "@/lib/mock-data";
import { predictTeamWorkload, getRedistributionSuggestions } from "@/lib/ai/workload";
import { Users, AlertTriangle, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MgmtWorkloadPage() {
    const team = mockUsers.filter((u) => u.role === "employee");
    const teamWorkloads = useMemo(() => predictTeamWorkload(team, mockTasks, mockTimesheets, mockProjects), []);
    const suggestions = useMemo(() => getRedistributionSuggestions(teamWorkloads), [teamWorkloads]);

    return (
        <div className="space-y-6">
            <PageHeader title="Workload Overview" description="Organization-wide workload distribution" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Overloaded" value={teamWorkloads.filter((tw) => tw.workload.status === "overloaded").length} icon={AlertTriangle} glow />
                <StatCard title="Balanced" value={teamWorkloads.filter((tw) => tw.workload.status === "balanced").length} icon={Users} />
                <StatCard title="Burnout Risk" value={teamWorkloads.filter((tw) => tw.workload.burnoutRisk === "high").length} subtitle="high risk" icon={Brain} />
            </div>
            {suggestions.length > 0 && <AISuggestionCard suggestions={suggestions} title="AI Workload Insights" />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamWorkloads.map(({ user, workload }) => (
                    <Card key={user.id}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div><h4 className="text-sm font-medium">{user.name}</h4><p className="text-xs text-muted-foreground">{user.position}</p></div>
                                <WorkloadBadge workload={workload} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground"><span>Workload</span><span>{workload.workloadScore}%</span></div>
                            <Progress value={workload.workloadScore} className="h-2" />
                            <div className="flex items-center gap-3 text-xs">
                                <span>Burnout: <RiskBadge level={workload.burnoutRisk} /></span>
                                <span className="text-muted-foreground">Next week: {workload.predictedNextWeekHours}h</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

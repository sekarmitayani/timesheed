"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { mockTimesheets, mockProjects } from "@/lib/mock-data";

export default function HistoryPage() {
    const user = useAuthStore((s) => s.user);
    const history = mockTimesheets.filter((t) => t.userId === user?.id && t.status === "approved");

    return (
        <div className="space-y-6">
            <PageHeader title="History" description="Your approved timesheet and activity history" />
            <Card>
                <CardHeader><CardTitle className="text-sm">Approved Records</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {history.map((entry) => {
                            const project = mockProjects.find((p) => p.id === entry.projectId);
                            return (
                                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-medium">✓</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{entry.date} • {entry.hours}h</p>
                                        <p className="text-xs text-muted-foreground truncate">{project?.name} — {entry.description}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] shrink-0">approved</Badge>
                                </div>
                            );
                        })}
                        {history.length === 0 && (
                            <p className="text-center py-8 text-sm text-muted-foreground">No approved records yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

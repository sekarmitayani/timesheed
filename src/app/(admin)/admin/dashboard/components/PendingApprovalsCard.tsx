"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, CheckCircle2, Users, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResourceRequest } from "@/lib/services/resource-service";

interface PendingApprovalsCardProps {
    requests: ResourceRequest[];
}

export function PendingApprovalsCard({ requests }: PendingApprovalsCardProps) {
    const router = useRouter();

    return (
        <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" /> Pending Approvals
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => router.push("/admin/resources")}>
                        View All <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="py-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">All caught up! No pending approvals.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {requests.map(r => (
                            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => router.push("/admin/resources")}>
                                <div className="h-8 w-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                                    {r.type === "manpower" ? <Users className="h-3.5 w-3.5 text-destructive" /> : <Wrench className="h-3.5 w-3.5 text-destructive" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{r.details}</p>
                                    <p className="text-[10px] text-muted-foreground">{r.user?.full_name || `User #${r.user_id}`} · {r.project?.name || `Project #${r.project_id}`}</p>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold rounded-full px-2.5 py-0.5 bg-destructive/10 text-destructive border-none shrink-0">Pending</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { ResourceRequest } from "@/lib/services/resource-service";

interface RecentActivityCardProps {
    activities: ResourceRequest[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
    const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

    return (
        <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" /> Recent Resource Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-400">No recent activity.</div>
                ) : (
                    <div className="space-y-2">
                        {activities.map(r => (
                            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    r.status === "approved" ? "bg-primary/10 border-primary/20" :
                                    r.status === "rejected" ? "bg-destructive/10 border-destructive/20" :
                                    "bg-muted border-border"
                                }`}>
                                    {r.status === "approved" ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                    ) : r.status === "rejected" ? (
                                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{r.details}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{r.user?.full_name || `User #${r.user_id}`}</span>
                                        <span>·</span>
                                        <span className="capitalize">{r.type}</span>
                                        {r.amount > 0 && <><span>·</span><span className="text-primary font-medium">{fmtCurrency(r.amount)}</span></>}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`text-[9px] font-bold capitalize shrink-0 rounded-full px-2.5 py-0.5 border-none ${
                                    r.status === "approved" ? "bg-primary/10 text-primary" :
                                    r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                                    "bg-secondary/15 text-secondary"
                                }`}>{r.status}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

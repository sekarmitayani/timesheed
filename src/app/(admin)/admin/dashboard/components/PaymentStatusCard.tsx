"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, Wrench } from "lucide-react";
import { DashboardStats } from "../hooks/useAdminDashboardData";

interface PaymentStatusCardProps {
    stats: DashboardStats;
}

export function PaymentStatusCard({ stats }: PaymentStatusCardProps) {
    const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

    return (
        <Card className="border-[#e2e8f0] shadow-sm">
            <CardHeader className="pb-1 border-b border-border/60">
                <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" /> Sub-Ledger Payment Status
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium ml-7 -mt-0.5">All contract schemes</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-3 flex flex-col h-full">
                {/* Overall Progress */}
                <div className="space-y-1 flex-none">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-muted-foreground">Overall Distribution</span>
                        <span className="font-bold text-lg text-foreground leading-none">{stats.paymentProgress}%</span>
                    </div>
                    <Progress value={stats.paymentProgress} className="h-3 bg-muted" />
                    <div className="flex justify-between text-[11px] font-medium text-muted-foreground pt-1">
                        <span>Distributed: <span className="text-foreground font-bold">{fmtCurrency(stats.totalPaid)}</span></span>
                        <span>Unpaid: <span className="text-foreground font-bold">{fmtCurrency(stats.totalUnpaid)}</span></span>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-border flex-1">
                    <div className="flex items-center justify-between py-1 px-1 hover:bg-muted/50 transition-colors rounded">
                        <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">Pending</Badge>
                        <span className="text-base font-bold text-foreground">{stats.contractsPending}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 px-1 hover:bg-muted/50 transition-colors rounded">
                        <Badge className="bg-secondary/15 text-secondary hover:bg-secondary/30 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">Partially Paid</Badge>
                        <span className="text-base font-bold text-foreground">{stats.contractsPartiallyPaid}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 px-1 hover:bg-muted/50 transition-colors rounded">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">Paid</Badge>
                        <span className="text-base font-bold text-foreground">{stats.contractsPaid}</span>
                    </div>
                </div>

                {/* Resource Cost */}
                <div className="pt-2 pb-0 border-t border-slate-100 flex-none mt-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">Approved Resource Cost</span>
                        </div>
                        <span className="text-sm font-bold text-[#0f172a]">{fmtCurrency(stats.totalResourceCost)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

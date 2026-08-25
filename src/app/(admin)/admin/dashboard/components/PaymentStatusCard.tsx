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
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Wallet className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Sub-Ledger Payment Status
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Overall distribution and contract payment status
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                {/* Overall Progress */}
                <div className="space-y-1.5 flex-none">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Distribution</span>
                        <span className="font-bold text-lg text-slate-800 leading-none">{stats.paymentProgress}%</span>
                    </div>
                    <Progress value={stats.paymentProgress} className="h-1.5 bg-slate-50 [&>div]:bg-[#4B7BEC]" />
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter text-slate-400 pt-0.5">
                        <span>Paid: <span className="text-[#4B7BEC]">{fmtCurrency(stats.totalPaid)}</span></span>
                        <span>Unpaid: <span className="text-slate-500">{fmtCurrency(stats.totalUnpaid)}</span></span>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-1 pt-3 border-t border-slate-50 flex-1 mt-3">
                    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50/50 transition-colors rounded-lg group">
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-none rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-tighter">Pending</Badge>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-[#4B7BEC] transition-colors">{stats.contractsPending}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50/50 transition-colors rounded-lg group">
                        <Badge variant="outline" className="bg-blue-50 text-[#4B7BEC] border-none rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-tighter">Partially Paid</Badge>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-[#4B7BEC] transition-colors">{stats.contractsPartiallyPaid}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50/50 transition-colors rounded-lg group">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-tighter">Paid</Badge>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-[#4B7BEC] transition-colors">{stats.contractsPaid}</span>
                    </div>
                </div>

                {/* Resource Cost */}
                <div className="pt-2.5 mt-3 border-t border-slate-50 flex-none">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Wrench className="h-3 w-3 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resource Cost</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{fmtCurrency(stats.totalResourceCost)}</span>
                    </div>
                </div>
                </div>
            </CardContent>
        </Card>
    );
}

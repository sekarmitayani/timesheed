"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, Wrench, Clock, Coins, CheckCircle2 } from "lucide-react";
import { DashboardStats } from "../hooks/useAdminDashboardData";

interface PaymentStatusCardProps {
    stats: DashboardStats;
}

export function PaymentStatusCard({ stats }: PaymentStatusCardProps) {
    const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;
    const totalContracts = stats.contractsPending + stats.contractsPartiallyPaid + stats.contractsPaid;

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
                    <div className="space-y-1.5 flex-none pb-3 border-b border-slate-100">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Distribution</span>
                            <span className="font-bold text-lg text-slate-800 leading-none">{stats.paymentProgress}%</span>
                        </div>
                        <Progress value={stats.paymentProgress} className="h-1.5 bg-slate-50 [&>div]:bg-[#4B7BEC]" />
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-bold uppercase tracking-tighter text-slate-400 pt-0.5">
                            <span>Paid: <span className="text-[#4B7BEC]">{fmtCurrency(stats.totalPaid)}</span></span>
                            <span>Unpaid: <span className="text-slate-500">{fmtCurrency(stats.totalUnpaid)}</span></span>
                        </div>
                    </div>

                    {/* Status Breakdown (Enlarged & Responsive Flex Cards) */}
                    <div className="flex-1 flex flex-col justify-between gap-2.5 py-3 my-0.5">
                        {/* Pending */}
                        <div className="flex-1 min-h-[56px] flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100/80 flex items-center justify-center shrink-0">
                                    <Clock className="h-4.5 w-4.5 text-amber-600" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Pending</span>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/60 rounded-full px-1.5 py-0 text-[8px] font-black uppercase tracking-wider">
                                            {totalContracts > 0 ? `${Math.round((stats.contractsPending / totalContracts) * 100)}%` : "0%"}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                                        Awaiting payment settlement
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-800 leading-none group-hover:text-amber-600 transition-colors">
                                    {stats.contractsPending}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Contracts
                                </span>
                            </div>
                        </div>

                        {/* Partially Paid */}
                        <div className="flex-1 min-h-[56px] flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center shrink-0">
                                    <Coins className="h-4.5 w-4.5 text-[#4B7BEC]" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Partially Paid</span>
                                        <Badge variant="outline" className="bg-blue-50 text-[#4B7BEC] border-blue-200/60 rounded-full px-1.5 py-0 text-[8px] font-black uppercase tracking-wider">
                                            {totalContracts > 0 ? `${Math.round((stats.contractsPartiallyPaid / totalContracts) * 100)}%` : "0%"}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                                        Installment in progress
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-800 leading-none group-hover:text-[#4B7BEC] transition-colors">
                                    {stats.contractsPartiallyPaid}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Contracts
                                </span>
                            </div>
                        </div>

                        {/* Paid */}
                        <div className="flex-1 min-h-[56px] flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Paid</span>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 rounded-full px-1.5 py-0 text-[8px] font-black uppercase tracking-wider">
                                            {totalContracts > 0 ? `${Math.round((stats.contractsPaid / totalContracts) * 100)}%` : "0%"}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                                        Fully settled contracts
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">
                                    {stats.contractsPaid}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Contracts
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Resource Cost */}
                    <div className="pt-3 border-t border-slate-100 flex-none">
                        <div className="flex items-center justify-between bg-slate-50/50 rounded-lg px-3 py-2 border border-slate-100/60">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Cost</span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-800">{fmtCurrency(stats.totalResourceCost)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

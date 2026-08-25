"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowRight } from "lucide-react";
import { ProjectProfitItem } from "@/lib/services/management-service";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TopProjectsCardProps {
    data?: ProjectProfitItem[];
    isLoading: boolean;
}

const fmtCurrencyShort = (v: number): string => {
    if (!v) return "Rp 0";
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
    return `Rp ${v.toLocaleString("id-ID")}`;
};

export function TopProjectsCard({ data, isLoading }: TopProjectsCardProps) {
    if (isLoading) {
        return (
            <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-1 border-b border-slate-50">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="px-4 pb-2 pt-2 flex-1">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const projects = data || [];

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Trophy className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Top Projects
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Highest margin percentage
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="flex-1 overflow-auto">
                    {projects.length > 0 ? (
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left font-bold text-slate-500 py-2 px-4">Project</th>
                                    <th className="text-right font-bold text-slate-500 py-2 px-4">Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p, i) => (
                                    <tr key={p.project_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-2.5 px-4 min-w-0 max-w-[120px]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-700 truncate">{p.project_name}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-slate-400 font-medium truncate">{p.client_name}</span>
                                                    <Badge variant="outline" className={`text-[8px] h-3.5 px-1 py-0 leading-none ${p.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {p.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`font-black ${(p.margin_percent || 0) > 0 ? "text-emerald-600" : (p.margin_percent || 0) < 0 ? "text-red-600" : "text-slate-600"}`}>
                                                    {(p.margin_percent || 0).toFixed(1)}%
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {fmtCurrencyShort(p.net_margin || 0)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="h-full min-h-[150px] flex items-center justify-center text-xs font-medium text-slate-400">
                            No projects data
                        </div>
                    )}
                </div>

                <div className="px-4 py-2.5 mt-auto border-t border-slate-50 flex justify-end shrink-0">
                    <Link 
                        href="/management/profitability" 
                        className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5] flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                        View All <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

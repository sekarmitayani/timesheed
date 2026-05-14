"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectFinancial } from "../hooks/useAdminDashboardData";

interface ProjectDistributionCardProps {
    projectFinancials: ProjectFinancial[];
}

export function ProjectDistributionCard({ projectFinancials }: ProjectDistributionCardProps) {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const totalPages = Math.ceil(projectFinancials.length / ITEMS_PER_PAGE);
    const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
    const currentProjects = projectFinancials.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE
    );

    const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

    return (
        <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="pb-1 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-[#4B7BEC]" /> Project Budget Distribution
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 -mt-0.5">Distribution of payroll costs across active projects</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[9px] font-bold text-[#4B7BEC] gap-1 hover:bg-blue-50 px-2" 
                    onClick={() => router.push("/admin/payroll")}
                >
                    Details <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent className="px-4 pt-3 pb-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                    {projectFinancials.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-medium">No project financial data available yet.</div>
                    ) : (
                        currentProjects.map(pf => (
                            <div key={pf.name} className="space-y-1.5 group cursor-pointer" onClick={() => router.push(`/admin/payroll?project=${encodeURIComponent(pf.name)}`)}>
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-800 group-hover:text-[#4B7BEC] transition-colors truncate">{pf.name}</p>
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight truncate">{pf.client}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                                        <p className="text-xs font-bold text-slate-800">{fmtCurrency(pf.totalPaid)}</p>
                                        <p className="text-[9px] text-slate-400 font-semibold tracking-tighter">OF {fmtCurrency(pf.totalContractValue)}</p>
                                    </div>
                                </div>
                                <div className="relative h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-[#4B7BEC] transition-all duration-700"
                                        style={{ width: `${Math.min(pf.progressPercent, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter text-slate-400">
                                    <span className="text-[#4B7BEC]">{pf.progressPercent}% DISTRIBUTED</span>
                                    <span>{fmtCurrency(pf.remaining)} UNPAID</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[9px] uppercase tracking-wider text-slate-500 hover:text-[#4B7BEC] hover:bg-blue-50"
                            disabled={safeCurrentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                        </Button>
                        <span className="text-[9px] font-bold text-slate-400">
                            Page {safeCurrentPage} of {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[9px] uppercase tracking-wider text-slate-500 hover:text-[#4B7BEC] hover:bg-blue-50"
                            disabled={safeCurrentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

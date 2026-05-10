"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectFinancial } from "../hooks/useAdminDashboardData";

interface ProjectDistributionCardProps {
    projectFinancials: ProjectFinancial[];
}

export function ProjectDistributionCard({ projectFinancials }: ProjectDistributionCardProps) {
    const router = useRouter();

    const fmtCurrency = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

    return (
        <Card className="lg:col-span-2 border-[#e2e8f0] shadow-sm">
            <CardHeader className="pb-1 border-b border-border/60">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" /> Employee Distribution by Project
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium ml-7 -mt-0.5">All contract schemes</p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs font-semibold text-primary gap-1 hover:bg-primary/10" 
                        onClick={() => router.push("/admin/payroll")}
                    >
                        View Distributions <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
                {projectFinancials.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No project financial data available yet.</div>
                ) : (
                    projectFinancials.map(pf => (
                        <div key={pf.name} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate">{pf.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{pf.client}</p>
                                </div>
                                <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                                    <p className="text-sm font-bold text-foreground">{fmtCurrency(pf.totalPaid)}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">of {fmtCurrency(pf.totalContractValue)}</p>
                                </div>
                            </div>
                            <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                                    style={{ width: `${Math.min(pf.progressPercent, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                                <span className="text-primary">{pf.progressPercent}% distributed</span>
                                <span>{fmtCurrency(pf.remaining)} unpaid</span>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

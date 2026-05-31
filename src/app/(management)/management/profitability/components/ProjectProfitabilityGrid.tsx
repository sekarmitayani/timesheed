"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { ProjectProfitCardData } from "../hooks/useProfitabilityData";

interface ProjectProfitabilityGridProps {
    projects: ProjectProfitCardData[];
}

const fmtCurrency = (v: number): string => {
    return `Rp ${v.toLocaleString("id-ID")}`;
};

export function ProjectProfitabilityGrid({ projects }: ProjectProfitabilityGridProps) {
    if (!projects || projects.length === 0) {
        return (
            <div className="py-12 text-center text-sm text-slate-500 font-medium bg-white rounded-xl border border-slate-100 shadow-sm">
                No project data available.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Project Profitability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                    const isPositive = project.net_margin >= 0;
                    const marginAbs = Math.abs(project.margin_percent);
                    const marginColor =
                        project.margin_percent >= 50
                            ? "bg-blue-600"
                            : project.margin_percent >= 20
                            ? "bg-slate-400"
                            : "bg-red-500";
                    const marginTextColor =
                        project.margin_percent >= 50
                            ? "text-blue-700"
                            : project.margin_percent >= 20
                            ? "text-slate-700"
                            : "text-red-600";

                    const statusColor = 
                        project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        project.status === "completed" ? "bg-blue-100 text-blue-700" :
                        project.status === "on-hold" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600";

                    return (
                        <Card key={project.project_id} className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden">
                            <CardContent className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm tracking-tight line-clamp-1 pr-2">
                                            {project.project_name}
                                        </h4>
                                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                            {project.client_name || "Internal Project"}
                                        </p>
                                    </div>
                                    <div className={`${statusColor} text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest shrink-0`}>
                                        {project.status === "active" ? "ACTIVE" : project.status}
                                    </div>
                                </div>

                                {/* PM */}
                                <div className="flex items-center gap-1.5 mb-6 text-slate-500">
                                    <User className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium truncate">
                                        {project.pm_name || "Unassigned"}
                                    </span>
                                </div>

                                {/* Contract & Expenses */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            CONTRACT VAL
                                        </p>
                                        <p className="text-xs font-bold text-slate-700">
                                            {fmtCurrency(project.contract_value)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            EXPENSES
                                        </p>
                                        <p className="text-xs font-bold text-slate-700">
                                            {fmtCurrency(project.total_expenses)}
                                        </p>
                                    </div>
                                </div>

                                {/* Net Margin Box */}
                                <div className="bg-slate-50 rounded-lg p-3 flex items-end justify-between mb-4 border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">
                                            NET MARGIN
                                        </p>
                                        <p className={`text-base font-black tracking-tight ${marginTextColor}`}>
                                            {!isPositive && "- "}
                                            {fmtCurrency(Math.abs(project.net_margin))}
                                        </p>
                                    </div>
                                    <div className="text-xl font-black text-slate-800 tracking-tight">
                                        {!isPositive && "-"}
                                        {marginAbs.toFixed(0)}%
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${marginColor} rounded-full`}
                                        style={{ width: `${Math.min(marginAbs, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

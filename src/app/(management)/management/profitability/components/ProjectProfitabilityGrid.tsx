"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { ProjectProfitCardData } from "../hooks/useProfitabilityData";

interface ProjectProfitabilityGridProps {
    projects: ProjectProfitCardData[];
}

const fmtCurrency = (v: number): string => {
    return `Rp ${v.toLocaleString("id-ID")}`;
};

export function ProjectProfitabilityGrid({ projects }: ProjectProfitabilityGridProps) {
    const [showAll, setShowAll] = useState(false);

    if (!projects || projects.length === 0) {
        return (
            <div className="py-12 text-center text-sm text-slate-500 font-medium bg-white rounded-md border border-slate-100 shadow-xs">
                No project data available.
            </div>
        );
    }

    const INITIAL_COUNT = 6;
    const hasMore = projects.length > INITIAL_COUNT;
    const displayedProjects = showAll ? projects : projects.slice(0, INITIAL_COUNT);

    return (
        <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Project Profitability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedProjects.map((project) => {
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

                    const statusRaw = project.status.toLowerCase();
                    const statusColor = 
                        statusRaw === "active" ? "bg-emerald-50 text-emerald-600" :
                        statusRaw === "completed" ? "bg-blue-50 text-[#2568C1]" :
                        (statusRaw === "on-hold" || statusRaw === "on hold" || statusRaw === "on_hold") ? "bg-amber-50 text-amber-600" :
                        statusRaw === "cancelled" ? "bg-rose-50 text-rose-600" :
                        "bg-slate-100 text-slate-600";
                        
                    const formatStatus = (s: string) => s.replace(/[_-]/g, ' ');

                    return (
                        <Card key={project.project_id} className="bg-white border-slate-100 shadow-2xs hover:shadow-xs rounded-md overflow-hidden transition-shadow p-0 py-0 gap-0">
                            <CardContent className="p-3.5 sm:p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-1.5">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate">
                                            {project.project_name}
                                        </h4>
                                        <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                            {project.client_name || "Internal Project"}
                                        </p>
                                    </div>
                                    <div className={`${statusColor} text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest shrink-0`}>
                                        {formatStatus(project.status)}
                                    </div>
                                </div>

                                {/* PM */}
                                <div className="flex items-center gap-1.5 mb-2.5 text-slate-500">
                                    <User className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium truncate">
                                        {project.pm_name || "Unassigned"}
                                    </span>
                                </div>

                                {/* Contract & Expenses */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                            CONTRACT VAL
                                        </p>
                                        <p className="text-xs sm:text-[13px] font-bold text-slate-700 truncate">
                                            {fmtCurrency(project.contract_value)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                            EXPENSES
                                        </p>
                                        <p className="text-xs sm:text-[13px] font-bold text-slate-700 truncate">
                                            {fmtCurrency(project.total_expenses)}
                                        </p>
                                    </div>
                                </div>

                                {/* Net Margin Box */}
                                <div className="bg-slate-50/80 rounded-md px-3 py-1.5 sm:py-2 flex items-end justify-between mb-2.5 border border-slate-100">
                                    <div>
                                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">
                                            NET MARGIN
                                        </p>
                                        <p className={`text-sm sm:text-base font-black tracking-tight ${marginTextColor}`}>
                                            {!isPositive && "- "}
                                            {fmtCurrency(Math.abs(project.net_margin))}
                                        </p>
                                    </div>
                                    <div className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
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

            {hasMore && (
                <div className="pt-4 flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-full transition-colors"
                    >
                        {showAll ? "Show Less" : `Show All ${projects.length} Projects`}
                        {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            )}
        </div>
    );
}

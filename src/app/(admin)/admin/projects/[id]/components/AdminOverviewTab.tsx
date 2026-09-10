"use client";

import { ApiProject, ProjectMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CalendarDays, Clock, Info, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminAIForecastSection } from "./AdminAIForecastSection";

interface AdminOverviewTabProps {
    project: ApiProject;
    members: ProjectMember[];
}

export function AdminOverviewTab({ project, members }: AdminOverviewTabProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const margin = (project.budget_revenue || 0) - (project.budget_cost || 0);
    const pmMember = members.find(m => m.role_in_project?.trim().toLowerCase() === "project manager");
    const pm = pmMember?.user?.full_name || "Not Assigned";

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: "Revenue", value: project.budget_revenue, icon: "bg-blue-50 text-blue-600", color: "text-slate-900" },
                    { label: "Cost Threshold", value: project.budget_cost_threshold, icon: "bg-orange-50 text-orange-600", color: "text-slate-900" },
                    { label: "Planned Cost", value: project.budget_cost, icon: "bg-amber-50 text-amber-600", color: "text-slate-900" },
                    { label: "Actual Cost", value: project.actual_cost, icon: "bg-purple-50 text-purple-600", color: (project.actual_cost || 0) > (project.budget_cost_threshold || Infinity) ? "text-red-600" : "text-slate-900" },
                ].map((item, i) => (
                    <Card key={i} className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                        <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.icon)}>
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                                <p className={cn("text-sm sm:text-base font-bold tracking-tight truncate", item.color)}>
                                    {formatCurrency(item.value || 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Information */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Info className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                            <div className="flex flex-col">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Project Information
                                </CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                    Client and assigned manager details
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-between">
                        <div className="p-4 sm:p-5 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Client Name</span>
                                    <span className="text-sm font-bold text-slate-700">{project.client_name || "-"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Client Email</span>
                                    <span className="text-sm font-bold text-slate-700 truncate block">{project.client_email || "-"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                    pm !== "Not Assigned" ? "bg-blue-50 text-[#4B7BEC]" : "bg-slate-100 text-slate-400"
                                )}>
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Project Manager</span>
                                    <span className="text-sm font-bold text-slate-800">{pm}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                                <div className="flex items-center gap-2.5">
                                    <CalendarDays className="h-4 w-4 text-slate-300" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Created</span>
                                        <span className="text-xs font-bold text-slate-600">{format(new Date(project.created_at), "dd MMM yyyy")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Clock className="h-4 w-4 text-slate-300" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Last Sync</span>
                                        <span className="text-xs font-bold text-slate-600">{format(new Date(project.updated_at), "dd MMM yyyy")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <CalendarDays className="h-4 w-4 text-slate-300" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Deadline</span>
                                        <span className="text-xs font-bold text-slate-600">{project.deadline ? format(new Date(project.deadline), "dd MMM yyyy") : "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Banknote className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                            <div className="flex flex-col">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Financial Performance
                                </CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                    Margin estimate and profitability
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-between">
                        <div className="p-4 sm:p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Margin Estimate</span>
                                    <span className={cn("text-lg font-black tracking-tight", margin >= 0 ? "text-emerald-600" : "text-red-600")}>
                                        {formatCurrency(margin)}
                                    </span>
                                </div>
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", margin >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                                    <Banknote className="h-6 w-6" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <UserCheck className="h-4 w-4 text-slate-400" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-500">Team Size</span>
                                        <span className="text-sm font-bold text-slate-800">{members.length} members</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Data composition verified by audit system</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Forecast Section */}
            <AdminAIForecastSection projectId={project.id.toString()} />
        </div>
    );
}

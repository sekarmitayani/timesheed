"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";
import { WorkingHoursData, ProjectEfficiencyItem } from "../hooks/useManagementDashboardData";
import Link from "next/link";

interface WorkingHoursCardProps {
    workingHours: WorkingHoursData;
    projectEfficiency: ProjectEfficiencyItem[];
}

export function WorkingHoursCard({ workingHours, projectEfficiency }: WorkingHoursCardProps) {
    const maxHours = Math.max(...projectEfficiency.map((p) => p.hours), 1);

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Working Hours Efficiency
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Aggregate hours tracked and efficiency metrics
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="px-4 pt-3 pb-2 flex-1 flex flex-col justify-between">
                    {/* Summary Boxes */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="border border-slate-100 bg-slate-50/40 rounded-xl p-2.5 text-center">
                            <span className="text-2xl font-black text-slate-800 tracking-tight block">
                                {workingHours.totalHours}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                                Total Hours
                            </span>
                        </div>
                        <div className="border border-slate-100 bg-slate-50/40 rounded-xl p-2.5 text-center">
                            <span className="text-2xl font-black text-slate-800 tracking-tight block">
                                {workingHours.totalDays}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                                Total Days
                            </span>
                        </div>
                    </div>

                    {/* Project Efficiency */}
                    {projectEfficiency.length > 0 && (
                        <div className="flex-1 flex flex-col justify-around">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Project Efficiency (Hrs)
                            </p>
                            <div className="space-y-2.5">
                                {projectEfficiency.map((project) => (
                                    <div key={project.id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[65%]">
                                                {project.name}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                                                {project.hours} hrs
                                            </span>
                                        </div>
                                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-full bg-slate-700 transition-all duration-700"
                                                style={{
                                                    width: `${Math.min((project.hours / maxHours) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {projectEfficiency.length === 0 && (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-xs text-slate-400 font-medium">No project data available.</p>
                        </div>
                    )}
                </div>

                <div className="px-4 py-2.5 mt-auto border-t border-slate-100 flex justify-end shrink-0">
                    <Link 
                        href="/management/reports" 
                        className="text-[10px] font-bold text-[#4B7BEC] hover:text-[#385bb5] flex items-center gap-1 transition-colors uppercase tracking-widest"
                    >
                        View Reports <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

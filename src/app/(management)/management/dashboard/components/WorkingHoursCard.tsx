"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { WorkingHoursData, ProjectEfficiencyItem } from "../hooks/useManagementDashboardData";

interface WorkingHoursCardProps {
    workingHours: WorkingHoursData;
    projectEfficiency: ProjectEfficiencyItem[];
}

export function WorkingHoursCard({ workingHours, projectEfficiency }: WorkingHoursCardProps) {
    const maxHours = Math.max(...projectEfficiency.map((p) => p.hours), 1);

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="pb-1 border-b border-slate-50">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#4B7BEC]" /> Working Hours Efficiency
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 -mt-0.5">Aggregate hours tracked and efficiency metrics</p>
                </div>
            </CardHeader>
            <CardContent className="px-4 pt-4 pb-4 flex-1 flex flex-col justify-between">
                {/* Summary Boxes */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="border border-slate-100 rounded-lg p-3 text-center">
                        <span className="text-2xl font-black text-slate-800 tracking-tight block">
                            {workingHours.totalHours}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Total Hours
                        </span>
                    </div>
                    <div className="border border-slate-100 rounded-lg p-3 text-center">
                        <span className="text-2xl font-black text-slate-800 tracking-tight block">
                            {workingHours.totalDays}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Total Days
                        </span>
                    </div>
                </div>

                {/* Project Efficiency */}
                {projectEfficiency.length > 0 && (
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Project Efficiency (Hrs)
                        </p>
                        <div className="space-y-3">
                            {projectEfficiency.map((project) => (
                                <div key={project.id} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[60%]">
                                            {project.name}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                                            {project.hours} hrs
                                        </span>
                                    </div>
                                    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
            </CardContent>
        </Card>
    );
}

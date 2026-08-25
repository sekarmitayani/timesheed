"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { ApiProject } from "@/lib/types";
import { ApiTask } from "@/lib/services/task-service";

interface ActiveProjectsTrackerProps {
    projects: ApiProject[];
    tasks: ApiTask[];
}

export function ActiveProjectsTracker({ projects, tasks }: ActiveProjectsTrackerProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // 1. Urutkan project berdasarkan created_at TERBARU (Newest First)
    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }, [projects]);

    const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
    
    // Safety check for page bounds
    const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
    
    const currentProjects = sortedProjects.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE
    );

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow p-0 py-0 gap-0">
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Activity className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Active Projects Progress
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Real-time completion status of active projects
                        </p>
                    </div>
                </div>
                {projects.length > 0 && (
                    <span className="text-[9px] font-bold text-[#4B7BEC] bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {projects.length} Total
                    </span>
                )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    {currentProjects.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No active projects to track.</p>
                    ) : (
                        currentProjects.map((project) => {
                            const pTasks = tasks.filter(t => t.project_id === project.id);
                            const pDone = pTasks.filter(t => t.status === "done").length;
                            const pTotal = pTasks.length;
                            const progressPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                            
                            return (
                                <div key={project.id} className="p-2.5 rounded-lg border border-slate-50 bg-white hover:border-blue-100 hover:shadow-sm transition-all space-y-2 group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#4B7BEC] transition-colors truncate">{project.name}</h4>
                                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">{project.client_name}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <span className="text-[11px] font-bold text-slate-800 block">{progressPct}%</span>
                                            <span className="text-[9px] text-slate-400 font-semibold block">{pDone} / {pTotal} Tasks</span>
                                        </div>
                                    </div>
                                    <Progress value={progressPct} className="h-1 bg-slate-50 [&>div]:bg-[#4B7BEC]" />
                                </div>
                            );
                        })
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
                </div>
            </CardContent>
        </Card>
    );
}

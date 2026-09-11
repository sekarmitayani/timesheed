import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCostItem } from "@/lib/services/management-service";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ProjectCostSummaryDetailModal } from "./ProjectCostSummaryDetailModal";

interface ProjectCostSummaryListProps {
    projects?: ProjectCostItem[];
    isLoading: boolean;
}

export function ProjectCostSummaryList({ projects, isLoading }: ProjectCostSummaryListProps) {
    const router = useRouter();
    const [showAll, setShowAll] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectCostItem | null>(null);
    
    const fmtCurrencyShort = (v: number) => {
        if (v >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
        if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'active') return 'bg-emerald-50 text-emerald-600';
        if (s === 'completed') return 'bg-blue-50 text-[#2568C1]';
        if (s === 'on-hold' || s === 'on hold' || s === 'on_hold') return 'bg-amber-50 text-amber-600';
        if (s === 'cancelled') return 'bg-rose-50 text-rose-600';
        return 'bg-slate-100 text-slate-500';
    };

    const formatStatus = (s: string) => s.replace(/[_-]/g, ' ');

    const sortedProjects = projects ? [...projects].sort((a, b) => {
        const aActive = a.status.toLowerCase() === 'active';
        const bActive = b.status.toLowerCase() === 'active';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return b.total_cost - a.total_cost;
    }) : undefined;

    const displayedProjects = showAll ? sortedProjects : sortedProjects?.slice(0, 6);
    const hasMore = sortedProjects && sortedProjects.length > 6;

    return (
        <div className="mb-8">
            <h2 className="text-lg font-black text-slate-800 mb-4">Project Cost Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <Card key={i} className="bg-white border-slate-100 shadow-2xs rounded-md overflow-hidden p-0 py-0 gap-0">
                            <CardContent className="p-3.5 sm:p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-2.5 w-24" />
                                    <Skeleton className="h-6 w-28" />
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-2.5 w-24" />
                                        <Skeleton className="h-2.5 w-12" />
                                    </div>
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-full rounded-md pt-1" />
                            </CardContent>
                        </Card>
                    ))
                ) : !displayedProjects || displayedProjects.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-sm text-slate-500 font-medium bg-slate-50 rounded-md border border-slate-100 border-dashed">
                        No active projects found.
                    </div>
                ) : (
                    displayedProjects.map((project) => (
                        <Card key={project.project_id} className="bg-white border-slate-100 shadow-2xs hover:shadow-xs rounded-md overflow-hidden flex flex-col hover:border-blue-100 transition-all p-0 py-0 gap-0">
                            <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-bold text-slate-900 truncate pr-2">{project.project_name}</h3>
                                        <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-bold border-none px-2 py-0.5 rounded-sm shrink-0 ${getStatusBadge(project.status)}`}>
                                            {formatStatus(project.status)}
                                        </Badge>
                                    </div>
                                    
                                    <div className="mb-2.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Project Cost</p>
                                        <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">{fmtCurrencyShort(project.total_cost)}</p>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                                            <span>Salary vs Resources</span>
                                            <span>{project.salary_percent}% / {project.resource_percent}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-[#0f45a6]" style={{ width: `${project.salary_percent}%` }}></div>
                                            <div className="h-full bg-amber-700" style={{ width: `${project.resource_percent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full text-[#4B7BEC] font-bold text-xs hover:bg-blue-50/70 border-slate-200 h-8 rounded-md mt-auto"
                                    onClick={() => setSelectedProject(project)}
                                >
                                    View Details <ArrowRight className="ml-1.5 h-3 w-3" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {hasMore && (
                <div className="mt-4 flex justify-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => setShowAll(!showAll)} 
                        className="text-xs font-bold text-[#4B7BEC] hover:bg-blue-50 hover:text-[#2568C1]"
                    >
                        {showAll ? (
                            <>Show Less <ChevronUp className="ml-1.5 h-4 w-4" /></>
                        ) : (
                            <>Show All {sortedProjects?.length || 0} Projects <ChevronDown className="ml-1.5 h-4 w-4" /></>
                        )}
                    </Button>
                </div>
            )}
            <ProjectCostSummaryDetailModal
                project={selectedProject}
                open={!!selectedProject}
                onOpenChange={(open) => !open && setSelectedProject(null)}
            />
        </div>
    );
}

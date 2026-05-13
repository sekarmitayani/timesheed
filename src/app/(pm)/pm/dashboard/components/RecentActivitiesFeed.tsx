"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Calendar, FolderKanban } from "lucide-react";
import { ApiTask } from "@/lib/services/task-service";
import { TeamMemberStats } from "../hooks/usePMDashboardData";

import { ApiProject } from "@/lib/types";

interface RecentActivitiesFeedProps {
    recentTasks: ApiTask[];
    teamStats: TeamMemberStats[];
    projects: ApiProject[];
}

export function RecentActivitiesFeed({ recentTasks, teamStats, projects }: RecentActivitiesFeedProps) {
    // Limit to exactly 5 items
    const displayTasks = recentTasks.slice(0, 5);

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-1 border-b border-slate-50">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#4B7BEC]" /> Recent Task Activities
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 -mt-0.5">Latest status updates from the team</p>
                </div>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-2.5 flex-1">
                {displayTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No recent tasks recorded.</p>
                ) : (
                    <div className="relative border-l-2 border-slate-50 ml-3.5 mt-1">
                        {displayTasks.map((task) => {
                            const isDone = task.status === "done";
                            const Icon = isDone ? CheckCircle2 : Clock;
                            const dotColorClass = isDone ? "bg-emerald-500" : "bg-[#4B7BEC]";
                            
                            const member = teamStats.find(m => m.id === task.assigned_to_id);
                            const assigneeName = member ? member.name : `User #${task.assigned_to_id}`;

                            const project = projects.find(p => p.id === task.project_id);
                            const projectName = project ? project.name : `Project #${task.project_id}`;

                            return (
                                <div key={task.id} className="relative pl-6 py-2.5">
                                    <div className={`absolute -left-[13px] top-2 w-6 h-6 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm ${dotColorClass}`}>
                                        <Icon className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-800 leading-tight">
                                            {assigneeName} {isDone ? "completed" : "updated"} <span className="text-[#4B7BEC]">"{task.title}"</span>
                                        </p>
                                        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-tight mt-1">
                                            <div className="flex items-center gap-1.5 truncate max-w-[120px] text-slate-500">
                                                <FolderKanban className="h-3 w-3 shrink-0 text-slate-400" />
                                                <span className="truncate">{projectName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Calendar className="h-3 w-3" />
                                                {task.updated_at 
                                                    ? new Date(task.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

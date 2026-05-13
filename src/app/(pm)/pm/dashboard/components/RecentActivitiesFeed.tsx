"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Calendar } from "lucide-react";
import { ApiTask } from "@/lib/services/task-service";
import { TeamMemberStats } from "../hooks/usePMDashboardData";

interface RecentActivitiesFeedProps {
    recentTasks: ApiTask[];
    teamStats: TeamMemberStats[];
}

export function RecentActivitiesFeed({ recentTasks, teamStats }: RecentActivitiesFeedProps) {
    // Limit to exactly 5 items
    const displayTasks = recentTasks.slice(0, 5);

    return (
        <Card className="bg-white border-slate-100 shadow-sm rounded-xl h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-2.5 border-b border-slate-50">
                <div>
                    <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#4B7BEC]" /> Recent Task Activities
                    </CardTitle>
                    <p className="text-[9px] text-slate-400 font-medium ml-5.5 -mt-0.5">Latest status updates from the team</p>
                </div>
            </CardHeader>
            <CardContent className="p-3 flex-1">
                {displayTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No recent tasks recorded.</p>
                ) : (
                    <div className="relative border-l border-slate-100 ml-2 space-y-4 pb-2">
                        {displayTasks.map((task) => {
                            const isDone = task.status === "done";
                            const Icon = isDone ? CheckCircle2 : Clock;
                            const colorClass = isDone ? "text-emerald-500" : "text-[#4B7BEC]";
                            const bgClass = isDone ? "bg-emerald-50" : "bg-blue-50";
                            
                            const member = teamStats.find(m => m.id === task.assigned_to_id);
                            const assigneeName = member ? member.name : `User #${task.assigned_to_id}`;

                            return (
                                <div key={task.id} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-0 p-0.5 rounded-full bg-white border border-white">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}>
                                            <Icon className="h-2.5 w-2.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] text-slate-600 leading-snug">
                                            <span className="font-bold text-slate-800">{assigneeName}</span> 
                                            {isDone ? " completed " : " updated "} 
                                            <span className="font-semibold text-slate-800">
                                                "{task.title}"
                                            </span>
                                        </p>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {task.updated_at 
                                                ? new Date(task.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) 
                                                : '-'}
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

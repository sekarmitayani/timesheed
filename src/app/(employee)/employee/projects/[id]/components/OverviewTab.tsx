"use client";

import { useMemo } from "react";
import { ApiProject, ProjectMember } from "@/lib/types";
import { ApiTask } from "@/lib/services/task-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Edit3, Copy, CalendarDays } from "lucide-react";
import { format, subDays, addDays, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
    project: ApiProject;
    members: ProjectMember[];
    tasks: ApiTask[];
}

// SVG Donut Chart Component
function DonutChart({ segments, total, size = 180, strokeWidth = 20 }: {
    segments: { value: number; color: string; label: string }[];
    total: number;
    size?: number;
    strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let cumulativePercent = 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
            />
            {/* Segments */}
            {segments.map((seg, i) => {
                const percent = total > 0 ? seg.value / total : 0;
                const dashLength = circumference * percent;
                const dashOffset = circumference * cumulativePercent;
                cumulativePercent += percent;

                if (seg.value === 0) return null;

                return (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                        strokeDashoffset={-dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                    />
                );
            })}
        </svg>
    );
}

export function OverviewTab({ project, members, tasks }: OverviewTabProps) {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t) => t.status === "todo").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const sevenDaysFromNow = addDays(now, 7);

    const completedLast7Days = tasks.filter(t => t.status === "done" && isAfter(new Date(t.updated_at), sevenDaysAgo)).length;
    const updatedLast7Days = tasks.filter(t => isAfter(new Date(t.updated_at), sevenDaysAgo)).length;
    const createdLast7Days = tasks.filter(t => isAfter(new Date(t.created_at), sevenDaysAgo)).length;
    const dueSoon = tasks.filter(t => t.status !== "done" && t.due_date && isAfter(new Date(t.due_date), subDays(now, 1)) && isBefore(new Date(t.due_date), sevenDaysFromNow)).length;

    const donutSegments = [
        { value: todoTasks, color: "#94A3B8", label: "To Do" },
        { value: inProgressTasks, color: "#4B7BEC", label: "In Progress" },
        { value: completedTasks, color: "#10B981", label: "Done" },
    ];

    // Team workload computation
    const workloadData = useMemo(() => {
        if (totalTasks === 0 || members.length === 0) return [];
        const assigneeCounts: Record<number, { name: string; count: number }> = {};
        tasks.forEach(task => {
            const mid = task.assigned_to_id;
            if (!assigneeCounts[mid]) {
                const member = members.find(m => m.user_id === mid);
                assigneeCounts[mid] = {
                    name: member?.user?.full_name || `User ${mid}`,
                    count: 0,
                };
            }
            assigneeCounts[mid].count++;
        });
        return Object.entries(assigneeCounts)
            .map(([id, data]) => ({
                id: Number(id),
                name: data.name,
                count: data.count,
                percent: Math.round((data.count / totalTasks) * 100),
            }))
            .sort((a, b) => b.count - a.count);
    }, [tasks, members, totalTasks]);

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return (
        <div className="space-y-6 pb-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-slate-800 leading-tight">{completedLast7Days} completed</span>
                            <span className="text-[11px] font-medium text-slate-400">in the last 7 days</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <Edit3 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-slate-800 leading-tight">{updatedLast7Days} updated</span>
                            <span className="text-[11px] font-medium text-slate-400">in the last 7 days</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <Copy className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-slate-800 leading-tight">{createdLast7Days} created</span>
                            <span className="text-[11px] font-medium text-slate-400">in the last 7 days</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-slate-800 leading-tight">{dueSoon} due soon</span>
                            <span className="text-[11px] font-medium text-slate-400">in the next 7 days</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Overview + Team Workload - side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Overview */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-6">
                        <div className="mb-1">
                            <h3 className="text-[15px] font-bold text-slate-800">Status overview</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Get a snapshot of the status of your work items.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
                            {/* Donut Chart */}
                            <div className="relative shrink-0">
                                <DonutChart segments={donutSegments} total={totalTasks} size={150} strokeWidth={18} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl sm:text-3xl font-black text-slate-800">{totalTasks}</span>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 max-w-[70px] sm:max-w-[80px] text-center leading-tight">Total work items</span>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap sm:flex-col justify-center gap-x-6 gap-y-3">
                                {donutSegments.map((seg, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <div className="h-3 w-3 rounded-[3px] shrink-0" style={{ backgroundColor: seg.color }} />
                                        <span className="text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">{seg.label}: {seg.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Workload */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-6">
                        <div className="mb-1">
                            <h3 className="text-[15px] font-bold text-slate-800">Team workload</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Monitor the capacity of your team.
                            </p>
                        </div>
                        <div className="mt-6">
                            {/* Table Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[120px] sm:w-[180px] shrink-0">Assignee</span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-1">Work distribution</span>
                            </div>
                            {/* Table Rows */}
                            <div className="flex flex-col gap-3">
                                {workloadData.map((row) => (
                                    <div key={row.id} className="flex items-center gap-4">
                                        <div className="flex items-center gap-2.5 w-[120px] sm:w-[180px] shrink-0">
                                            <Avatar className="h-7 w-7 border border-slate-200 shrink-0">
                                                <AvatarFallback className="text-[9px] font-bold bg-slate-800 text-white">
                                                    {getInitials(row.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">{row.name}</span>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1 h-7 bg-slate-100 rounded-[4px] overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-400 rounded-[4px] flex items-center px-2.5 transition-all duration-500"
                                                    style={{ width: `${Math.max(row.percent, 8)}%` }}
                                                >
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-white whitespace-nowrap">{row.percent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {workloadData.length === 0 && (
                                    <div className="text-sm text-slate-400 text-center py-6">No tasks assigned yet.</div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content - 3 column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    {/* General Information */}
                    <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-[15px] font-bold text-slate-800">
                                General Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                    Client Name
                                </span>
                                <div className="text-sm font-bold text-slate-800">
                                    {project.client_name}
                                </div>
                            </div>

                            {project.client_email && (
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                        Client Email
                                    </span>
                                    <div className="text-sm font-bold text-slate-800">
                                        {project.client_email}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                    Created At
                                </span>
                                <div className="text-sm font-bold text-slate-800">
                                    {format(new Date(project.created_at), "dd MMMM yyyy, HH:mm")}
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Description */}
                    <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[15px] font-bold text-slate-800">
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                No description provided for this project.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Activity */}
                    <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-[15px] font-bold text-slate-800">
                                Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pl-3 border-l-2 border-slate-100 space-y-6 ml-2">
                                {recentTasks.map((task) => {
                                    const creator = members.find(m => m.user_id === task.created_by_id)?.user?.full_name || `User ${task.created_by_id}`;
                                    return (
                                        <div key={task.id} className="relative">
                                            <div className="absolute -left-[18.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#4B7BEC] border-[3px] border-white shadow-sm" />
                                            <div className="flex flex-col gap-1 pl-2">
                                                <h4 className="text-sm font-bold text-slate-800">New Task Added: {task.title}</h4>
                                                <p className="text-xs text-slate-500">
                                                    <span className="font-semibold text-[#4B7BEC]">{creator}</span> created a new task
                                                </p>
                                                <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                    {format(new Date(task.created_at), "dd MMM yyyy, HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {recentTasks.length === 0 && (
                                    <div className="text-sm text-slate-500 py-4 pl-2">No activity recorded yet.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>


        </div>
    );
}

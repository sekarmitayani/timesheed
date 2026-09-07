"use client";

import { useMemo, useState } from "react";
import { ApiProject, ProjectMember } from "@/lib/types";
import { ApiTask } from "@/lib/services/task-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Edit3, Copy, CalendarDays, Activity, PieChart, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, addDays, isAfter, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";

interface PMOverviewTabProps {
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

export function PMOverviewTab({ project, members, tasks = [] }: PMOverviewTabProps) {
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

    // Pagination for Workload
    const [workloadPage, setWorkloadPage] = useState(1);
    const itemsPerPage = 6;

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

    const totalPages = Math.ceil(workloadData.length / itemsPerPage);
    const paginatedWorkload = workloadData.slice((workloadPage - 1) * itemsPerPage, workloadPage * itemsPerPage);

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">{completedLast7Days} completed</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">in the last 7 days</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-[#4B7BEC] shrink-0">
                            <Edit3 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">{updatedLast7Days} updated</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">in the last 7 days</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100/60 flex items-center justify-center text-purple-600 shrink-0">
                            <Copy className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">{createdLast7Days} created</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">in the last 7 days</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 shrink-0">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">{dueSoon} due soon</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">in the next 7 days</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 1: General Information + Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* General Information */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Activity className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                            <div className="flex flex-col">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    General Information
                                </CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                    Project timeline and client details
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-between">
                        <div className="p-4 sm:p-5 flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Client Name
                                    </span>
                                    <div className="text-sm font-bold text-slate-800">
                                        {project.client_name || "-"}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Client Email
                                    </span>
                                    <div className="text-sm font-bold text-slate-800 truncate">
                                        {project.client_email || "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Assigned Project Manager
                                </span>
                                <div className="text-sm font-bold text-slate-800">
                                    {members.find(m => m.user?.role === "projectmanager" || m.role_in_project?.toLowerCase().includes("manager"))?.user?.full_name || "Unassigned"}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Created At
                                    </span>
                                    <div className="text-xs sm:text-sm font-bold text-slate-700">
                                        {format(new Date(project.created_at), "dd MMM yyyy, HH:mm")}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Deadline
                                    </span>
                                    <div className="text-xs sm:text-sm font-bold text-slate-700">
                                        {project.deadline ? format(new Date(project.deadline), "dd MMM yyyy") : "Not Set"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Overview */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <PieChart className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                            <div className="flex flex-col">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Status Overview
                                </CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                    Snapshot of work item statuses
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-center">
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 flex-1">
                            {/* Donut Chart */}
                            <div className="relative shrink-0">
                                <DonutChart segments={donutSegments} total={totalTasks} size={140} strokeWidth={16} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl sm:text-3xl font-black text-slate-800">{totalTasks}</span>
                                    <span className="text-[10px] font-medium text-slate-400 max-w-[70px] text-center leading-tight">Total items</span>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap sm:flex-col justify-center gap-x-5 gap-y-2.5">
                                {donutSegments.map((seg, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: seg.color }} />
                                        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{seg.label}: <span className="font-bold text-slate-800">{seg.value}</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Team Workload + Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Workload */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Users className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                            <div className="flex flex-col">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Team Workload
                                </CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                    Monitor capacity and distribution
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col justify-between">
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                                {/* Table Header */}
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[120px] sm:w-[160px] shrink-0">Assignee</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-1">Work distribution</span>
                                </div>
                                {/* Table Rows */}
                                <div className="flex flex-col gap-2.5">
                                    {paginatedWorkload.map((row) => (
                                        <div key={row.id} className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 w-[120px] sm:w-[160px] shrink-0">
                                                <Avatar className="h-6 w-6 border border-slate-200 shrink-0">
                                                    <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-[#4B7BEC] to-[#385bb5] text-white">
                                                        {getInitials(row.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium text-slate-700 truncate">{row.name}</span>
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="flex-1 h-6 bg-slate-100 rounded-[4px] overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#4B7BEC] rounded-[4px] flex items-center px-2 transition-all duration-500"
                                                        style={{ width: `${Math.max(row.percent, 8)}%` }}
                                                    >
                                                        <span className="text-[9px] font-bold text-white whitespace-nowrap">{row.percent}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {workloadData.length === 0 && (
                                        <div className="text-xs text-slate-400 text-center py-6">No tasks assigned yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400">
                                        Page {workloadPage} of {totalPages}
                                    </span>
                                    <div className="flex gap-1.5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] text-slate-600 hover:text-[#4B7BEC] hover:bg-blue-50"
                                            onClick={() => setWorkloadPage(p => Math.max(1, p - 1))}
                                            disabled={workloadPage === 1}
                                        >
                                            <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] text-slate-600 hover:text-[#4B7BEC] hover:bg-blue-50"
                                            onClick={() => setWorkloadPage(p => Math.min(totalPages, p + 1))}
                                            disabled={workloadPage === totalPages}
                                        >
                                            Next <ChevronRight className="h-3 w-3 ml-0.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity */}
                <Card className="bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0">
                    <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Activity className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                            <div className="flex flex-col">
                                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Recent Activity
                                </CardTitle>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                    Latest updates in the project
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col">
                        <div className="p-4 sm:p-5 flex-1">
                            <div className="relative pl-3 border-l-2 border-slate-100 space-y-3.5 ml-2">
                                {recentTasks.map((task) => {
                                    const creator = members.find(m => m.user_id === task.created_by_id)?.user?.full_name || `User ${task.created_by_id}`;
                                    return (
                                        <div key={task.id} className="relative">
                                            <div className="absolute -left-[18.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#4B7BEC] border-[3px] border-white shadow-sm" />
                                            <div className="flex flex-col gap-0.5 pl-2">
                                                <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                                                <p className="text-[11px] text-slate-500">
                                                    <span className="font-semibold text-[#4B7BEC]">{creator}</span> created a task
                                                </p>
                                                <span className="text-[9px] font-medium text-slate-400">
                                                    {format(new Date(task.created_at), "dd MMM yyyy, HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {recentTasks.length === 0 && (
                                    <div className="text-xs text-slate-400 py-6 text-center">No activity recorded yet.</div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

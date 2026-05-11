"use client";

import { ApiProject, ProjectMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, CalendarDays, Clock, UserCheck, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PMOverviewTabProps {
    project: ApiProject;
    members: ProjectMember[];
    stats: { todo: number; in_progress: number; done: number };
}

export function PMOverviewTab({ project, members, stats }: PMOverviewTabProps) {
    const pm = members.find(m => m.role_in_project === "Project Manager")?.user?.full_name || "Not Assigned";

    return (
        <div className="space-y-4">
            {/* Task Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Pending (To Do)", value: stats.todo, iconBg: "bg-slate-50 text-slate-500", icon: ListTodo },
                    { label: "Active (In Progress)", value: stats.in_progress, iconBg: "bg-blue-50 text-[#4B7BEC]", icon: ListTodo },
                    { label: "Completed (Done)", value: stats.done, iconBg: "bg-emerald-50 text-emerald-600", icon: ListTodo },
                ].map((item, i) => (
                    <Card key={i} className="bg-white border border-slate-100 shadow-sm rounded-xl h-[100px] flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="px-4 py-3 flex flex-row items-center gap-4 h-full">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", item.iconBg)}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight truncate">
                                    {item.value} <span className="text-[10px] font-semibold text-slate-400 tracking-normal ml-0.5">Tasks</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Project Information */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-[15px] font-bold text-slate-800">
                            Project Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
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

                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                <Crown className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Project Manager</span>
                                <span className="text-sm font-bold text-slate-800">{pm}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                    </CardContent>
                </Card>

                {/* Team Summary */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-[15px] font-bold text-slate-800">
                            Team Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Resources</span>
                                <span className="text-lg font-black tracking-tight text-[#4B7BEC]">
                                    {members.length} Members
                                </span>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-[#4B7BEC] flex items-center justify-center shrink-0">
                                <UserCheck className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                This project is currently supported by a multidisciplinary team. You can view the full list of members and their roles in the <b>Teams</b> tab.
                            </p>
                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Collaboration verified by management</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

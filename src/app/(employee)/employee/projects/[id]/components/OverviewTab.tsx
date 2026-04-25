"use client";

import { useState } from "react";
import { ApiProject, ProjectMember } from "@/lib/types";
import { ApiTask } from "@/lib/services/task-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Phone, Mail, FileText, CheckCircle2, User, MailIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
    project: ApiProject;
    members: ProjectMember[];
    tasks: ApiTask[];
}

export function OverviewTab({ project, members, tasks }: OverviewTabProps) {
    const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
        active: { label: "In Progress", bg: "bg-blue-50/50 hover:bg-blue-50/50", text: "text-[#4B7BEC]" },
        completed: { label: "Completed", bg: "bg-emerald-50 hover:bg-emerald-50", text: "text-emerald-600" },
        "on-hold": { label: "On Hold", bg: "bg-amber-50 hover:bg-amber-50", text: "text-amber-600" },
        cancelled: { label: "Cancelled", bg: "bg-red-50 hover:bg-red-50", text: "text-red-600" },
    };
    const statusObj = statusConfig[project.status] || statusConfig.active;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatRoleLabel = (role: string) => {
        return role
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
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

                {/* Teams */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-[15px] font-bold text-slate-800">
                            Teams
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {members.map((member) => {
                            const name = member.user?.full_name || `User ${member.user_id}`;
                            return (
                                <div 
                                    key={member.id} 
                                    onClick={() => setSelectedMember(member)}
                                    className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-slate-100">
                                            <AvatarFallback className="text-xs font-bold bg-white text-slate-600 shadow-sm">
                                                {getInitials(name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{name}</span>
                                            <span className="text-[11px] font-medium text-slate-500">
                                                {formatRoleLabel(member.role_in_project)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {members.length === 0 && (
                            <div className="text-sm text-slate-500 text-center py-4">No team members assigned</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6 lg:col-span-2">
                {/* Progress Card (Replaces Budget spent & Progress to be full width or single big card) */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800">Task Progress</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {format(new Date(project.created_at), "d MMM")} - Today
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-[#4B7BEC]/10 flex items-center justify-center text-[#4B7BEC]">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="text-3xl font-black text-slate-800 mb-6">{totalTasks} <span className="text-sm font-medium text-slate-500 ml-1">Total Tasks</span></div>
                            
                            <div className="flex items-center justify-between text-xs font-bold mb-2">
                                <span className="text-slate-500">Progress</span>
                                <span className="text-[#4B7BEC]">{progressPercent}%</span>
                            </div>
                            
                            <Progress value={progressPercent} className="h-2.5 bg-slate-100 [&>div]:bg-[#4B7BEC]" />
                            
                            <div className="flex items-center justify-between mt-3 text-xs font-semibold">
                                <span className="text-emerald-500 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {completedTasks} Done
                                </span>
                                <span className="text-slate-400">
                                    To Do: {totalTasks - completedTasks}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card className="border-[#E2E8F0] shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[15px] font-bold text-slate-800">
                            Description
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {/* Dummy description based on reference image */}
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nisl dui, fringilla ac venenatis ut, varius at arcu. 
                            Sed mollis nisl. Phasellus a facilisis ligula, sit amet ultrices arcu. Vestibulum sit amet erat nibh. Vestibulum lacus metus, 
                            ullamcorper accumsan gravida sit amet, rutrum ut odio. Nulla lorem diam, euismod et condimentum eu, lobortis.
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
                            {recentTasks.map((task, i) => {
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

            <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Team Member Details</DialogTitle>
                        <DialogDescription>
                            Contact information and role in this project.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedMember && (
                        <div className="flex flex-col gap-6 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                                    <AvatarFallback className="text-sm font-bold bg-slate-50 text-slate-600">
                                        {getInitials(selectedMember.user?.full_name || `User ${selectedMember.user_id}`)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {selectedMember.user?.full_name || `User ${selectedMember.user_id}`}
                                    </h3>
                                    <Badge className="mt-1 bg-[#4B7BEC]/10 text-[#4B7BEC] border-none shadow-none hover:bg-[#4B7BEC]/20">
                                        {formatRoleLabel(selectedMember.role_in_project)}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                                        <MailIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                                        <span className="font-medium text-slate-700">{selectedMember.user?.email || "No email provided"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                                        <span className="font-medium text-slate-700">{selectedMember.user?.phone_number || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Inline icons for specific styles in this component
function Building2Icon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    )
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    )
}

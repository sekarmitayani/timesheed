"use client";

import { ApiProject, ProjectMember } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PMProjectHeaderProps {
    project: ApiProject;
    members: ProjectMember[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    active: { label: "Active", bg: "bg-blue-50/50", text: "text-[#4B7BEC]", dot: "bg-[#4B7BEC]" },
    completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
    "on-hold": { label: "On Hold", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
    cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

export function PMProjectHeader({ project, members, activeTab, setActiveTab }: PMProjectHeaderProps) {
    const status = statusConfig[project.status] || statusConfig.active;

    const getInitials = (name: string) => {
        return (name || "?")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const visibleMembers = members.slice(0, 3);
    const extraMembers = Math.max(0, members.length - 3);

    const tabs = ["Overview", "Kanban", "List", "Calendar", "Resources", "Teams"];

    return (
        <div className="flex flex-col border-b border-[#E2E8F0] bg-white pt-4 px-4 sm:px-8 mb-4 shadow-sm rounded-t-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-5">
                <div className="h-16 w-16 rounded-full border border-slate-100 shadow-sm flex items-center justify-center bg-white p-2 shrink-0">
                    <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-xl font-black text-slate-400">
                        {project.name.charAt(0).toUpperCase()}
                    </div>
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight truncate">{project.name}</h1>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("px-3 py-1 rounded-full font-semibold border border-transparent shadow-none gap-2 shrink-0", status.bg, status.text)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                            {status.label}
                        </Badge>

                        <div className="flex items-center ml-0 sm:ml-2">
                            <div className="flex items-center -space-x-2">
                                {visibleMembers.map((member) => {
                                    const name = member.user?.full_name || `User ${member.user_id}`;
                                    return (
                                        <Avatar key={member.id} className="h-8 w-8 border-2 border-white shadow-sm">
                                            <AvatarFallback className="text-[10px] font-bold bg-slate-100 text-slate-600">
                                                {getInitials(name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                                {extraMembers > 0 && (
                                    <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center z-10">
                                        <span className="text-[10px] font-bold text-[#4B7BEC]">
                                            +{extraMembers}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-all relative whitespace-nowrap",
                            activeTab === tab
                                ? "text-[#4B7BEC]"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4B7BEC] rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

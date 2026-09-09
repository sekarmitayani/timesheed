"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PMProjectCardData } from "../hooks/usePMProjectsData";
import { useRouter } from "next/navigation";

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export const statusConfig: Record<string, { label: string; bg: string; text: string; accent: string }> = {
    active: { label: "Active", bg: "bg-emerald-50/50", text: "text-emerald-700", accent: "bg-emerald-500" },
    completed: { label: "Completed", bg: "bg-blue-50/50", text: "text-blue-700", accent: "bg-blue-500" },
    "on_hold": { label: "On Hold", bg: "bg-amber-50/50", text: "text-amber-700", accent: "bg-amber-500" },
    "on-hold": { label: "On Hold", bg: "bg-amber-50/50", text: "text-amber-700", accent: "bg-amber-500" },
    cancelled: { label: "Cancelled", bg: "bg-red-50/50", text: "text-red-700", accent: "bg-red-500" },
    canceled: { label: "Cancelled", bg: "bg-red-50/50", text: "text-red-700", accent: "bg-red-500" },
};

const getInitials = (name: string) => {
    return (name || "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

interface PMProjectCardProps {
    data: PMProjectCardData;
}

export function PMProjectCard({ data }: PMProjectCardProps) {
    const router = useRouter();
    const { project, members } = data;
    const status = statusConfig[project.status] || statusConfig.active;

    const visibleMembers = members.slice(0, 3);
    const extraCount = Math.max(0, members.length - 3);

    return (
        <Card
            onClick={() => router.push(`/pm/projects/${project.id}`)}
            className="group border-[#E2E8F0] bg-white rounded-md shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer p-0 py-0 gap-0"
        >
            <CardContent className="p-0 flex flex-col h-full">
                <div className={cn("h-[3px] w-full", status.accent)} />

                <div className="flex items-start gap-3 p-4 pb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-[#0f172a] truncate mb-1 group-hover:text-[#4B7BEC] transition-colors">
                            {project.name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="text-[11px] text-muted-foreground font-medium truncate">
                                {project.client_name}
                            </span>
                        </div>
                    </div>
                    <Badge className={cn("px-2 py-0.5 rounded-full border-none text-[10px] font-bold shrink-0", status.bg, status.text)}>
                        {status.label}
                    </Badge>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50 mt-auto">
                    <TooltipProvider>
                        <div className="flex items-center -space-x-2" onClick={(e) => e.stopPropagation()}>
                            {visibleMembers.map((member) => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <div className="relative inline-block cursor-pointer">
                                            <Avatar className="h-7 w-7 border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-20">
                                                <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                    {getInitials(member.user?.full_name || "")}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs bg-slate-900 text-white px-2.5 py-1 z-50">
                                        <p className="font-semibold">{member.user?.full_name || "Unknown Member"}</p>
                                        {member.role_in_project && (
                                            <p className="text-[10px] text-slate-300 capitalize">{member.role_in_project}</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {extraCount > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-7 w-7 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center z-10 cursor-pointer transition-transform hover:scale-110">
                                            <span className="text-[9px] font-bold text-slate-500">+{extraCount}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs bg-slate-900 text-white p-2 z-50 max-w-[200px]">
                                        <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">Other Members:</p>
                                        <div className="flex flex-col gap-0.5">
                                            {members.slice(3).map(m => (
                                                <span key={m.id} className="truncate text-xs">
                                                    {m.user?.full_name || "Unknown"}
                                                </span>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {members.length === 0 && (
                                <span className="text-[10px] text-slate-400 font-medium italic">No members</span>
                            )}
                        </div>
                    </TooltipProvider>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {members.length} Members
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

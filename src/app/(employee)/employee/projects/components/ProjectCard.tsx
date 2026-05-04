import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Mail, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCardData } from "../hooks/useProjectsData";
import { useRouter } from "next/navigation";

export const statusConfig: Record<string, { label: string; bg: string; text: string; accent: string }> = {
    active: { label: "Active", bg: "bg-[#4B7BEC]/[0.08]", text: "text-[#4B7BEC]", accent: "bg-[#4B7BEC]" },
    completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", accent: "bg-emerald-500" },
    "on-hold": { label: "On Hold", bg: "bg-amber-50", text: "text-amber-700", accent: "bg-amber-500" },
    cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", accent: "bg-red-500" },
};

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

interface ProjectCardProps {
    data: ProjectCardData;
}

export function ProjectCard({ data }: ProjectCardProps) {
    const router = useRouter();
    const project = data.project;
    const status = statusConfig[project.status] || statusConfig.active;
    const visibleMembers = data.members.slice(0, 3);
    const extraCount = Math.max(0, data.members.length - 3);

    return (
        <Card
            onClick={() => router.push(`/employee/projects/${project.id}`)}
            className="group border-[#E2E8F0] bg-white rounded-[6px] shadow-sm overflow-hidden transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
        >
            <CardContent className="p-0">
                {/* Top accent bar */}
                <div className={cn("h-[3px] w-full", status.accent)} />

                {/* Top Row: Project Info */}
                <div className="flex items-start gap-3 p-4 pb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#0f172a] truncate group-hover:text-[#4B7BEC] transition-colors">
                                {project.name}
                            </h3>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="text-[11px] text-muted-foreground font-medium truncate">
                                    {project.client_name}
                                </span>
                            </div>
                            {project.client_email && (
                                <div className="flex items-center gap-1.5">
                                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="text-[11px] text-muted-foreground font-medium truncate">
                                        {project.client_email}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hover Arrow */}
                    <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white opacity-0 group-hover:opacity-100 transition-all border border-[#E2E8F0] shadow-sm shrink-0 mt-0.5">
                        <ChevronRight className="h-3.5 w-3.5 text-[#4B7BEC]" />
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-[#E2E8F0] mx-4" />

                {/* Bottom Row: Status, Members */}
                <div className="flex items-center justify-between p-4 pt-3">
                    {/* Status */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            Status
                        </span>
                        <Badge
                            className={cn(
                                "px-2 py-0.5 rounded-full border-none text-[10px] font-bold w-fit",
                                status.bg,
                                status.text
                            )}
                        >
                            {status.label}
                        </Badge>
                    </div>

                    {/* Members */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            Members
                        </span>
                        <div className="flex items-center -space-x-1.5">
                            {visibleMembers.map((member) => {
                                const name =
                                    member.user?.full_name || `User ${member.user_id}`;
                                return (
                                    <Avatar
                                        key={member.id}
                                        className="h-6 w-6 border-2 border-white"
                                    >
                                        <AvatarFallback className="text-[8px] font-bold bg-slate-100 text-slate-600">
                                            {getInitials(name)}
                                        </AvatarFallback>
                                    </Avatar>
                                );
                            })}
                            {extraCount > 0 && (
                                <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-slate-500">
                                        +{extraCount}
                                    </span>
                                </div>
                            )}
                            {data.members.length === 0 && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5 text-slate-300" />
                                    <span className="text-[10px] text-slate-400">—</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

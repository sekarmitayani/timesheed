"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ai/ai-components";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Loader2,
    Search,
    Building2,
    Mail,
    FolderKanban,
    Users,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { ApiProject, ProjectMember } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; bg: string; text: string; accent: string }> = {
    active: { label: "Active", bg: "bg-[#4B7BEC]/[0.08]", text: "text-[#4B7BEC]", accent: "bg-[#4B7BEC]" },
    completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", accent: "bg-emerald-500" },
    "on-hold": { label: "On Hold", bg: "bg-amber-50", text: "text-amber-700", accent: "bg-amber-500" },
    cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", accent: "bg-red-500" },
};

interface ProjectCardData {
    project: ApiProject;
    members: ProjectMember[];
}

export default function EmployeeProjectsPage() {
    const currentUser = useAuthStore((s) => s.user);
    const router = useRouter();
    const [projectCards, setProjectCards] = useState<ProjectCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await projectService.getProjects(1, 100);
                const projectList = res.data || [];

                // Fetch members for each project in parallel
                const cardPromises = projectList.map(async (project) => {
                    let members: ProjectMember[] = [];

                    try {
                        members = await projectService.getProjectMembers(project.id);
                        if (!Array.isArray(members)) members = [];
                    } catch { /* skip */ }

                    return { project, members } as ProjectCardData;
                });

                const cards = await Promise.all(cardPromises);
                setProjectCards(cards);
            } catch (e: any) {
                toast.error(e.message || "Failed to load projects");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const filteredCards = useMemo(() => {
        let result = [...projectCards];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.project.name.toLowerCase().includes(q) ||
                    c.project.client_name.toLowerCase().includes(q) ||
                    (c.project.client_email && c.project.client_email.toLowerCase().includes(q))
            );
        }

        if (filterStatus !== "all") {
            result = result.filter((c) => c.project.status === filterStatus);
        }

        return result;
    }, [projectCards, searchQuery, filterStatus]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex flex-col w-full gap-4 h-full overflow-hidden">
            <PageHeader
                title="My Projects"
                description="Projects you're currently assigned to."
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by project or client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px] h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <div className="ml-auto text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {filteredCards.length} project{filteredCards.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] opacity-40" />
                </div>
            ) : filteredCards.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 opacity-60">
                        <div className="bg-slate-100 p-5 rounded-full">
                            <FolderKanban className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {searchQuery || filterStatus !== "all"
                                ? "No projects match your filters."
                                : "No projects assigned yet."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Contact your project manager to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredCards.map((card) => {
                            const project = card.project;
                            const status = statusConfig[project.status] || statusConfig.active;
                            const visibleMembers = card.members.slice(0, 3);
                            const extraCount = Math.max(0, card.members.length - 3);

                            return (
                                <Card
                                    key={project.id}
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
                                                    {card.members.length === 0 && (
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
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

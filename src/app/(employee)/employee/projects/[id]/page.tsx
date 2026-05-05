"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { projectService } from "@/lib/services/project-service";
import { taskService } from "@/lib/services/task-service";
import { ApiProject, ProjectMember } from "@/lib/types";

import { ProjectHeader } from "./components/ProjectHeader";
import { OverviewTab } from "./components/OverviewTab";
import { TaskViewsContainer } from "./components/TaskViewsContainer";
import { TeamsTab } from "./components/TeamsTab";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [activeTab, setActiveTab] = useState("Overview");

    // 1. Project Detail Query
    const { data: project, isLoading: isLoadingProject } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectService.getProjectById(projectId),
        enabled: !!projectId,
    });

    // 2. Members Query
    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['project', projectId, 'members'],
        queryFn: () => projectService.getProjectMembers(projectId),
        enabled: !!projectId,
    });

    // 3. Tasks Query
    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
        queryKey: ['project', projectId, 'tasks'],
        queryFn: () => taskService.getProjectTasks(projectId, true),
        enabled: !!projectId,
    });

    const isLoading = isLoadingProject || isLoadingMembers || isLoadingTasks;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] opacity-40" />
            </div>
        );
    }

    if (!project) return null;

    const isCalendarActive = activeTab === "Calendar";

    return (
        <div className={`flex flex-col w-full overflow-hidden ${isCalendarActive ? "h-[calc(100vh-40px)]" : "h-[calc(100vh-100px)]"}`}>
            {isCalendarActive ? (
                <>
                    <div className="shrink-0 w-full px-2">
                        <div className="flex items-center mb-4 px-1">
                            <Button 
                                variant="ghost" 
                                className="h-8 gap-2 text-slate-500 hover:text-slate-800 px-2"
                                onClick={() => router.push("/employee/projects")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-sm font-semibold">Back to Projects</span>
                            </Button>
                        </div>
                        <ProjectHeader 
                            project={project} 
                            members={members} 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab} 
                        />
                    </div>
                    <div className="flex-1 min-h-0 w-full px-2 pb-4">
                        <TaskViewsContainer
                            activeTab={activeTab}
                            project={project}
                            tasks={tasks}
                            members={members}
                        />
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                    <div className="w-full px-2">
                        <div className="flex items-center mb-4 px-1">
                            <Button 
                                variant="ghost" 
                                className="h-8 gap-2 text-slate-500 hover:text-slate-800 px-2"
                                onClick={() => router.push("/employee/projects")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-sm font-semibold">Back to Projects</span>
                            </Button>
                        </div>

                        <ProjectHeader 
                            project={project} 
                            members={members} 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab} 
                        />

                        {activeTab === "Overview" && (
                            <OverviewTab 
                                project={project} 
                                members={members} 
                                tasks={tasks} 
                            />
                        )}

                        {["Kanban", "List"].includes(activeTab) && (
                            <TaskViewsContainer
                                activeTab={activeTab}
                                project={project}
                                tasks={tasks}
                                members={members}
                            />
                        )}

                        {activeTab === "Teams" && (
                            <TeamsTab members={members} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

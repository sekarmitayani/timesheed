"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { projectService } from "@/lib/services/project-service";
import { taskService, ApiTask } from "@/lib/services/task-service";
import { ApiProject, ProjectMember } from "@/lib/types";

import { ProjectHeader } from "./components/ProjectHeader";
import { OverviewTab } from "./components/OverviewTab";
import { TaskTab } from "./components/TaskTab";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<ApiProject | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Overview");

    useEffect(() => {
        if (!projectId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [projRes, memRes, taskRes] = await Promise.all([
                    projectService.getProjectById(projectId),
                    projectService.getProjectMembers(projectId).catch(() => []),
                    taskService.getProjectTasks(projectId, true).catch(() => []),
                ]);

                setProject(projRes);
                setMembers(Array.isArray(memRes) ? memRes : []);
                setTasks(Array.isArray(taskRes) ? taskRes : []);
            } catch (error: any) {
                toast.error("Failed to load project details");
                router.push("/employee/projects");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId, router]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] opacity-40" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex flex-col w-full h-[calc(100vh-100px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                <div className="w-full px-2">
                    {/* Back navigation */}
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

                    {activeTab === "Task" && (
                        <TaskTab project={project} tasks={tasks} members={members} setTasks={setTasks} />
                    )}
                </div>
            </div>
        </div>
    );
}

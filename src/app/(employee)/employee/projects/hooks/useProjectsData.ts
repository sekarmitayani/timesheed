import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { projectService } from "@/lib/services/project-service";
import { ApiProject, ProjectMember } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";

export interface ProjectCardData {
    project: ApiProject;
    members: ProjectMember[];
}

export function useProjectsData() {
    const currentUser = useAuthStore((s) => s.user);
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
                        members = await projectService.getProjectMembers(String(project.id));
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

    return {
        state: {
            isLoading,
            searchQuery,
            filterStatus,
        },
        computed: {
            filteredCards,
        },
        actions: {
            setSearchQuery,
            setFilterStatus,
        }
    };
}

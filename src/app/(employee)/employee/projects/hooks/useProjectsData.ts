import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { ApiProject, ProjectMember } from "@/lib/types";

export interface ProjectCardData {
    project: ApiProject;
    members: ProjectMember[];
}

export function useProjectsData() {
    // Filters (Pure UI State)
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // 1. Fetch Project List
    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['employee', 'projects'],
        queryFn: () => projectService.getProjects(1, 100),
    });
    const projects = projectsData?.data || [];

    // 2. Fetch Members for all projects (Construct Card Data)
    const { data: projectCards = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['employee', 'projects', 'cards', projects.map(p => p.id)],
        queryFn: async () => {
            const cardPromises = projects.map(async (project) => {
                let members: ProjectMember[] = [];
                try {
                    const res = await projectService.getProjectMembers(String(project.id));
                    members = Array.isArray(res) ? res : [];
                } catch { /* skip */ }
                return { project, members } as ProjectCardData;
            });
            return await Promise.all(cardPromises);
        },
        enabled: projects.length > 0,
    });

    const isLoading = isLoadingProjects || (projects.length > 0 && isLoadingMembers);

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

        const statusOrder: Record<string, number> = {
            "active": 1,
            "completed": 2,
            "on-hold": 3,
            "cancelled": 4
        };

        result.sort((a, b) => {
            const statusA = statusOrder[a.project.status] || 99;
            const statusB = statusOrder[b.project.status] || 99;
            if (statusA !== statusB) {
                return statusA - statusB;
            }
            return new Date(b.project.created_at).getTime() - new Date(a.project.created_at).getTime();
        });

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

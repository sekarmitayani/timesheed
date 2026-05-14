import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { ApiProject, ProjectMember } from "@/lib/types";

export interface PMProjectCardData {
    project: ApiProject;
    members: ProjectMember[];
}

export function usePMProjectsData() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // 1. Fetch Project List
    const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['pm', 'projects', 'list', page, limit],
        queryFn: () => projectService.getProjects(page, limit),
        staleTime: 5 * 60 * 1000,
    });
    const projects = projectsResponse?.data || [];

    // 2. Fetch Members for all projects (to construct cards)
    const { data: projectCards = [], isLoading: isLoadingCards } = useQuery({
        queryKey: ['pm', 'projects', 'cards', projects.map(p => p.id)],
        queryFn: async () => {
            const cardPromises = projects.map(async (project) => {
                let members: ProjectMember[] = [];
                try {
                    const res = await projectService.getProjectMembers(String(project.id));
                    members = Array.isArray(res) ? res : [];
                } catch { /* skip */ }
                return { project, members } as PMProjectCardData;
            });
            return await Promise.all(cardPromises);
        },
        enabled: projects.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    const filteredCards = useMemo(() => {
        let result = [...projectCards];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c => 
                c.project.name.toLowerCase().includes(q) || 
                c.project.client_name.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== "All") {
            result = result.filter(c => c.project.status === statusFilter.toLowerCase());
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
    }, [projectCards, search, statusFilter]);

    return {
        state: {
            cards: filteredCards,
            isLoading: isLoadingProjects || (projects.length > 0 && isLoadingCards),
            search,
            statusFilter,
            pagination: projectsResponse?.pagination || { page: 1, limit: 10, total: 0 }
        },
        actions: {
            setSearch,
            setStatusFilter,
            setPage,
            setLimit
        }
    };
}

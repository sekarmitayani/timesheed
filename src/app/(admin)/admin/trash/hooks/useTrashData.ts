"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
    trashService, 
    TrashSummary, 
    TrashUser, 
    TrashContract, 
    TrashProject, 
    TrashResource 
} from "@/lib/services/trash-service";

export type TrashTabType = "users" | "projects" | "contracts" | "resources";

export interface RestoreItem {
    type: TrashTabType;
    id: number;
    title: string;
    subtitle?: string;
}

export function useTrashData() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TrashTabType>("users");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    
    // Restore Dialog state
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [itemToRestore, setItemToRestore] = useState<RestoreItem | null>(null);

    // 1. Summary Query
    const { data: summary, isLoading: isLoadingSummary } = useQuery<TrashSummary>({
        queryKey: ["trash", "summary"],
        queryFn: () => trashService.getSummary(),
        refetchOnWindowFocus: false,
    });

    // 2. Users Query
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<TrashUser[]>({
        queryKey: ["trash", "users"],
        queryFn: () => trashService.getDeletedUsers(),
        enabled: activeTab === "users",
        refetchOnWindowFocus: false,
    });

    // 3. Projects Query
    const { data: projects = [], isLoading: isLoadingProjects } = useQuery<TrashProject[]>({
        queryKey: ["trash", "projects"],
        queryFn: () => trashService.getDeletedProjects(),
        enabled: activeTab === "projects",
        refetchOnWindowFocus: false,
    });

    // 4. Contracts Query
    const { data: contracts = [], isLoading: isLoadingContracts } = useQuery<TrashContract[]>({
        queryKey: ["trash", "contracts"],
        queryFn: () => trashService.getDeletedContracts(),
        enabled: activeTab === "contracts",
        refetchOnWindowFocus: false,
    });

    // 5. Resources Query
    const { data: resources = [], isLoading: isLoadingResources } = useQuery<TrashResource[]>({
        queryKey: ["trash", "resources"],
        queryFn: () => trashService.getDeletedResources(),
        enabled: activeTab === "resources",
        refetchOnWindowFocus: false,
    });

    // Filtered lists
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase();
        return users.filter(u => 
            u.full_name.toLowerCase().includes(q) || 
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return projects;
        const q = searchQuery.toLowerCase();
        return projects.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.client_name.toLowerCase().includes(q)
        );
    }, [projects, searchQuery]);

    const filteredContracts = useMemo(() => {
        if (!searchQuery.trim()) return contracts;
        const q = searchQuery.toLowerCase();
        return contracts.filter(c => 
            c.user_name.toLowerCase().includes(q) || 
            c.user_email.toLowerCase().includes(q) ||
            (c.project_name && c.project_name.toLowerCase().includes(q)) ||
            c.contract_type.toLowerCase().includes(q)
        );
    }, [contracts, searchQuery]);

    const filteredResources = useMemo(() => {
        if (!searchQuery.trim()) return resources;
        const q = searchQuery.toLowerCase();
        return resources.filter(r => 
            r.details.toLowerCase().includes(q) || 
            r.user_name.toLowerCase().includes(q) ||
            r.project_name.toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q)
        );
    }, [resources, searchQuery]);

    // Paginated Slices
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredUsers.slice(start, start + limit);
    }, [filteredUsers, page, limit]);

    const paginatedProjects = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredProjects.slice(start, start + limit);
    }, [filteredProjects, page, limit]);

    const paginatedContracts = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredContracts.slice(start, start + limit);
    }, [filteredContracts, page, limit]);

    const paginatedResources = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredResources.slice(start, start + limit);
    }, [filteredResources, page, limit]);

    // Total pages
    const usersTotalPages = Math.ceil(filteredUsers.length / limit) || 1;
    const projectsTotalPages = Math.ceil(filteredProjects.length / limit) || 1;
    const contractsTotalPages = Math.ceil(filteredContracts.length / limit) || 1;
    const resourcesTotalPages = Math.ceil(filteredResources.length / limit) || 1;

    // Restore Mutations
    const restoreMutation = useMutation({
        mutationFn: async (item: RestoreItem) => {
            switch (item.type) {
                case "users":
                    return trashService.restoreUser(item.id);
                case "projects":
                    return trashService.restoreProject(item.id);
                case "contracts":
                    return trashService.restoreContract(item.id);
                case "resources":
                    return trashService.restoreResource(item.id);
            }
        },
        onSuccess: (data, variables) => {
            toast.success(data.message || "Item restored successfully");
            setRestoreDialogOpen(false);
            setItemToRestore(null);
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["trash"] });
            if (variables.type === "users") {
                queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            } else if (variables.type === "projects") {
                queryClient.invalidateQueries({ queryKey: ["projects"] });
                queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
            } else if (variables.type === "contracts") {
                queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
            } else if (variables.type === "resources") {
                queryClient.invalidateQueries({ queryKey: ["resources"] });
            }
        },
        onError: (err: any) => {
            toast.error(err?.message || "Failed to restore item");
        }
    });

    const openRestoreDialog = (item: RestoreItem) => {
        setItemToRestore(item);
        setRestoreDialogOpen(true);
    };

    const handleConfirmRestore = async () => {
        if (!itemToRestore) return;
        restoreMutation.mutate(itemToRestore);
    };

    return {
        activeTab,
        setActiveTab: (tab: TrashTabType) => {
            setActiveTab(tab);
            setSearchQuery("");
            setPage(1);
        },
        searchQuery,
        setSearchQuery: (q: string) => {
            setSearchQuery(q);
            setPage(1);
        },
        page,
        setPage,
        limit,
        setLimit: (l: number) => {
            setLimit(l);
            setPage(1);
        },
        summary: summary || { users: 0, contracts: 0, projects: 0, resources: 0 },
        isLoadingSummary,
        // Paginated Data
        paginatedUsers,
        paginatedProjects,
        paginatedContracts,
        paginatedResources,
        // Total counts
        totalUsers: filteredUsers.length,
        totalProjects: filteredProjects.length,
        totalContracts: filteredContracts.length,
        totalResources: filteredResources.length,
        // Total pages
        usersTotalPages,
        projectsTotalPages,
        contractsTotalPages,
        resourcesTotalPages,
        isLoading: isLoadingUsers || isLoadingProjects || isLoadingContracts || isLoadingResources,
        // Restore Dialog
        restoreDialogOpen,
        setRestoreDialogOpen,
        itemToRestore,
        openRestoreDialog,
        handleConfirmRestore,
        isRestoring: restoreMutation.isPending,
    };
}

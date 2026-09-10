import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { managementService } from "@/lib/services/management-service";
import { projectService } from "@/lib/services/project-service";
import { ResourceRequest } from "@/lib/services/resource-service";

export function useManagementResourcesData() {
    // Filter states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [filterProject, setFilterProject] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [search, setSearch] = useState("");

    // Modal states
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);

    // Fetch projects for filter
    const { data: projectsData } = useQuery({
        queryKey: ["admin-projects-list"], // reuse the admin or common projects list cache
        queryFn: () => projectService.getProjects(),
        staleTime: 5 * 60 * 1000,
    });

    const allProjects = projectsData?.data || [];

    // Fetch Stats
    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ["management-resource-stats"],
        queryFn: () => managementService.getManagementResourceStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch Table Data
    const { data: tableData, isLoading: isLoadingTable } = useQuery({
        queryKey: ["management-resources", page, limit, filterProject, filterStatus, filterType, search],
        queryFn: () => managementService.getManagementResources({
            page,
            limit,
            project_id: filterProject,
            status: filterStatus,
            type: filterType,
            search,
        }),
        staleTime: 60 * 1000, // 1 minute
    });

    // Reset pagination when filters change
    const handleSetFilterProject = (val: string) => { setFilterProject(val); setPage(1); };
    const handleSetFilterStatus = (val: string) => { setFilterStatus(val); setPage(1); };
    const handleSetFilterType = (val: string) => { setFilterType(val); setPage(1); };
    const handleSetSearch = (val: string) => { setSearch(val); setPage(1); };
    const handleSetLimit = (val: number) => { setLimit(val); setPage(1); };

    const openDetail = (request: ResourceRequest) => {
        setSelectedRequest(request);
        setDetailOpen(true);
    };

    return {
        // State
        page, setPage,
        limit, setLimit: handleSetLimit,
        filterProject, setFilterProject: handleSetFilterProject,
        filterStatus, setFilterStatus: handleSetFilterStatus,
        filterType, setFilterType: handleSetFilterType,
        search, setSearch: handleSetSearch,
        
        detailOpen, setDetailOpen,
        selectedRequest,

        // Data
        allProjects,
        stats: statsData,
        isLoadingStats,
        paginatedRequests: (tableData?.data || []).filter(
            (r: ResourceRequest) => !r.project?.name?.toLowerCase().includes("(deleted)")
        ),
        isLoading: isLoadingTable,
        totalPages: tableData?.pagination?.total_pages || 1,
        totalFiltered: tableData?.pagination?.total_rows || 0,

        // Actions
        openDetail,
    };
}

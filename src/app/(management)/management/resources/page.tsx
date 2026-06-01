"use client";

import { PageHeader } from "@/components/ai/ai-components";
import { useManagementResourcesData } from "./hooks/useManagementResourcesData";
import { ManagementQuickStats } from "./components/ManagementQuickStats";
import { ResourceFilters } from "./components/ResourceFilters";
import { ResourcesTable } from "./components/ResourcesTable";
import { ResourceDetailsDialog } from "./components/ResourceDetailsDialog";

export default function ManagementResourcesPage() {
    const {
        // State
        page, setPage,
        limit, setLimit,
        filterProject, setFilterProject,
        filterStatus, setFilterStatus,
        filterType, setFilterType,
        search, setSearch,
        detailOpen, setDetailOpen,
        selectedRequest,

        // Data
        allProjects,
        stats,
        isLoadingStats,
        paginatedRequests,
        isLoading,
        totalPages,
        totalFiltered,

        // Handlers
        openDetail,
    } = useManagementResourcesData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Resources" 
                description="Monitor project resource requests and spending realization."
            />

            <ManagementQuickStats 
                stats={stats} 
                isLoading={isLoadingStats} 
            />

            <ResourceFilters 
                filterProject={filterProject}
                setFilterProject={setFilterProject}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                limit={limit}
                setLimit={setLimit}
                allProjects={allProjects}
                search={search}
                setSearch={setSearch}
            />

            <ResourcesTable 
                paginatedRequests={paginatedRequests}
                isLoading={isLoading}
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
                totalFiltered={totalFiltered}
                limit={limit}
                openDetail={openDetail}
            />

            <ResourceDetailsDialog 
                open={detailOpen}
                onOpenChange={setDetailOpen}
                request={selectedRequest}
            />
        </div>
    );
}

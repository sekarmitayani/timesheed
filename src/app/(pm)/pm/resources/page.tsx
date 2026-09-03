"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { usePMResourcesData } from "./hooks/usePMResourcesData";
import { ResourceFilters } from "./components/ResourceFilters";
import { ResourcesTable } from "./components/ResourcesTable";
import { ResourceFormDialog } from "./components/ResourceFormDialog";
import { ResourceDetailsDialog } from "./components/ResourceDetailsDialog";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";

export default function PMResourcesPage() {
    const {
        // State
        page, setPage,
        limit, setLimit,
        searchQuery, setSearchQuery,
        filterProject, setFilterProject,
        filterStatus, setFilterStatus,
        filterType, setFilterType,
        createOpen, setCreateOpen,
        detailOpen, setDetailOpen,
        deleteOpen, setDeleteOpen,
        selectedRequest,
        createForm, setCreateForm,

        // Data
        allProjects,
        isLoading,
        filteredRequests,
        paginatedRequests,
        totalPages,
        totalFiltered,

        // Handlers
        openDetail,
        
        // Actions
        createRequest,
        deleteRequest,
        isProcessing
    } = usePMResourcesData();

    const pendingCount = filteredRequests.filter(r => r.status === "pending").length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Resource Request" 
                description={`${pendingCount} requests currently pending approval`}
            >
                <Button 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20 rounded-[6px]" 
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="h-4 w-4" /> New Request
                </Button>
            </PageHeader>

            <ResourceFilters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterProject={filterProject}
                setFilterProject={setFilterProject}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                limit={limit}
                setLimit={setLimit}
                allProjects={allProjects}
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

            <ResourceFormDialog 
                open={createOpen}
                onOpenChange={setCreateOpen}
                projects={allProjects}
                form={createForm}
                setForm={setCreateForm}
                onSubmit={createRequest}
                isProcessing={isProcessing}
            />

            <ResourceDetailsDialog 
                open={detailOpen}
                onOpenChange={setDetailOpen}
                request={selectedRequest}
                isProcessing={isProcessing}
                onDelete={() => setDeleteOpen(true)}
            />

            <ConfirmDeleteDialog 
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={() => selectedRequest && deleteRequest(selectedRequest.id)}
                isProcessing={isProcessing}
                requestId={selectedRequest?.id}
            />
        </div>
    );
}

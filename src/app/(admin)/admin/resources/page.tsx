"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { useAdminResourcesData } from "./hooks/useAdminResourcesData";
import { ResourceFilters } from "./components/ResourceFilters";
import { ResourcesTable } from "./components/ResourcesTable";
import { ResourceFormDialog } from "./components/ResourceFormDialog";
import { ResourceDetailsDialog } from "./components/ResourceDetailsDialog";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";

export default function AdminResourcesPage() {
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
        detailMode, setDetailMode,
        selectedRequest,
        approveAmount, setApproveAmount,
        editForm, setEditForm,
        createForm, setCreateForm,

        // Data
        allProjects,
        isLoading,
        filteredRequests,
        paginatedRequests,
        totalPages,

        // Handlers
        openDetail,
        
        // Actions
        createRequest,
        processApproval,
        editRequest,
        deleteRequest,
        isProcessing
    } = useAdminResourcesData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Resource Request" 
                description={`${filteredRequests.filter(r => r.status === "pending").length} requests need your review`}
            >
                <Button 
                    size="sm" 
                    className="gap-2 bg-[#2568C1] hover:bg-[#1e56a6] text-white rounded-lg shadow-sm" 
                    onClick={() => setCreateOpen(true)}
                >
                    + New Request
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
                totalFiltered={filteredRequests.length}
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
                mode={detailMode}
                setMode={setDetailMode}
                isProcessing={isProcessing}
                approveAmount={approveAmount}
                setApproveAmount={setApproveAmount}
                editForm={editForm}
                setEditForm={setEditForm}
                onApprove={(id, payload) => processApproval({ id, payload })}
                onReject={(id, payload) => processApproval({ id, payload })}
                onEdit={(id, payload) => editRequest({ id, payload })}
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

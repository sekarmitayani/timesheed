"use client";

import React from "react";
import { useTrashData } from "./hooks/useTrashData";
import { TrashHeader } from "./components/TrashHeader";
import { DeletedUsersTab } from "./components/DeletedUsersTab";
import { DeletedProjectsTab } from "./components/DeletedProjectsTab";
import { DeletedContractsTab } from "./components/DeletedContractsTab";
import { DeletedResourcesTab } from "./components/DeletedResourcesTab";
import { RestoreConfirmDialog } from "./components/RestoreConfirmDialog";

export default function TrashPage() {
    const {
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        page,
        setPage,
        limit,
        setLimit,
        summary,
        // Paginated items
        paginatedUsers,
        paginatedProjects,
        paginatedContracts,
        paginatedResources,
        // Total counts
        totalUsers,
        totalProjects,
        totalContracts,
        totalResources,
        // Total pages
        usersTotalPages,
        projectsTotalPages,
        contractsTotalPages,
        resourcesTotalPages,
        isLoading,
        restoreDialogOpen,
        setRestoreDialogOpen,
        itemToRestore,
        openRestoreDialog,
        handleConfirmRestore,
        isRestoring,
    } = useTrashData();

    return (
        <div className="space-y-4">
            {/* Header & Category Switcher */}
            <TrashHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                summary={summary}
            />

            {/* Tab Panels */}
            {activeTab === "users" && (
                <DeletedUsersTab
                    users={paginatedUsers}
                    totalUsers={totalUsers}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={usersTotalPages}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRestore={openRestoreDialog}
                    isLoading={isLoading}
                />
            )}

            {activeTab === "projects" && (
                <DeletedProjectsTab
                    projects={paginatedProjects}
                    totalProjects={totalProjects}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={projectsTotalPages}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRestore={openRestoreDialog}
                    isLoading={isLoading}
                />
            )}

            {activeTab === "contracts" && (
                <DeletedContractsTab
                    contracts={paginatedContracts}
                    totalContracts={totalContracts}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={contractsTotalPages}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRestore={openRestoreDialog}
                    isLoading={isLoading}
                />
            )}

            {activeTab === "resources" && (
                <DeletedResourcesTab
                    resources={paginatedResources}
                    totalResources={totalResources}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    totalPages={resourcesTotalPages}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onRestore={openRestoreDialog}
                    isLoading={isLoading}
                />
            )}

            {/* Restore Confirmation Dialog */}
            <RestoreConfirmDialog
                open={restoreDialogOpen}
                onOpenChange={setRestoreDialogOpen}
                item={itemToRestore}
                isRestoring={isRestoring}
                onConfirm={handleConfirmRestore}
            />
        </div>
    );
}

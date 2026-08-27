"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { useAdminContractsData } from "./hooks/useAdminContractsData";
import { ContractFilters } from "./components/ContractFilters";
import { ContractsTable } from "./components/ContractsTable";
import { ContractFormDialog } from "./components/ContractFormDialog";
import { ContractDetailsDialog } from "./components/ContractDetailsDialog";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";

export default function ContractsPage() {
    const { state, actions } = useAdminContractsData();

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Contract Administration" 
                description={`Managing ${state.allContractsCount} active and historical agreements`}
            >
                <Button 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20 rounded-[6px]" 
                    onClick={() => { actions.resetForm(); actions.setFormOpen(true); }}
                >
                    <Plus className="h-4 w-4" /> New Contract
                </Button>
            </PageHeader>

            {/* Filter Bar */}
            <ContractFilters 
                search={state.search} setSearch={actions.setSearch}
                statusFilter={state.statusFilter} setStatusFilter={actions.setStatusFilter}
                typeFilter={state.typeFilter} setTypeFilter={actions.setTypeFilter}
                schemeFilter={state.schemeFilter} setSchemeFilter={actions.setSchemeFilter}
                projectFilter={state.projectFilter} setProjectFilter={actions.setProjectFilter}
                limit={state.pagination.limit} setLimit={actions.setLimit}
                setPage={actions.setPage}
                activeProjectsCtx={state.activeProjectsCtx}
                allProjects={state.allProjects}
            />

            {/* Contracts Table */}
            <ContractsTable 
                contracts={state.contracts}
                isLoading={state.isLoading}
                pagination={state.pagination}
                allUsers={state.allUsers}
                onView={(c) => { actions.setSelectedContract(c); actions.setDetailsOpen(true); }}
                onEdit={actions.openEdit}
                onDelete={(c) => { actions.setContractToDelete(c); actions.setDeleteOpen(true); }}
                setPage={actions.setPage}
                totalContracts={state.filteredCount}
            />

            {/* Dialogs */}
            <ContractFormDialog 
                open={state.formOpen}
                onOpenChange={actions.setFormOpen}
                editId={state.editId}
                isSaving={state.isSaving}
                form={state.contractForm}
                setForm={actions.setContractForm}
                allUsers={state.allUsers}
                onSave={actions.handleSaveContract}
                onCancel={() => { actions.setFormOpen(false); actions.resetForm(); }}
            />

            <ContractDetailsDialog 
                open={state.detailsOpen}
                onOpenChange={actions.setDetailsOpen}
                contract={state.selectedContract}
                allUsers={state.allUsers}
                allProjects={state.allProjects}
            />

            <ConfirmDeleteDialog 
                open={state.deleteOpen}
                onOpenChange={actions.setDeleteOpen}
                contract={state.contractToDelete}
                allUsers={state.allUsers}
                isDeleting={state.isSaving}
                onConfirm={actions.handleDeleteContract}
            />
        </div>
    );
}

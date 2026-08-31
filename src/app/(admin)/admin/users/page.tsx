"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminUsersData } from "./hooks/useAdminUsersData";
import { UserFilters } from "./components/UserFilters";
import { UsersTable } from "./components/UsersTable";
import { UserFormDialog } from "./components/UserFormDialog";
import { UserDetailsDialog } from "./components/UserDetailsDialog";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";
import { ConfirmUserCreationDialog } from "./components/ConfirmUserCreationDialog";

export default function UsersPage() {
    const currentUser = useAuthStore((s) => s.user);
    const { state, actions } = useAdminUsersData();

    return (
        <div className="space-y-6">
            <PageHeader title="User Administration" description={`Managing ${state.pagination.total} total network users`}>
                <Button 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20 rounded-[6px]" 
                    onClick={() => { actions.resetForm(); actions.setEditId(null); actions.setAddOpen(true); }}
                >
                    <Plus className="h-4 w-4" /> Add User
                </Button>
            </PageHeader>

            <UserFilters 
                search={state.search} setSearch={actions.setSearch}
                statusFilter={state.statusFilter} setStatusFilter={actions.setStatusFilter}
                roleFilter={state.roleFilter} setRoleFilter={actions.setRoleFilter}
                typeFilter={state.typeFilter} setTypeFilter={actions.setTypeFilter}
                limit={state.pagination.limit} setLimit={actions.setLimit} setPage={actions.setPage}
            />

            <UsersTable 
                users={state.users}
                isLoading={state.isLoading}
                pagination={state.pagination}
                setPage={actions.setPage}
                onView={actions.openDetails}
                onEdit={actions.openEdit}
                onDelete={(u) => { actions.setUserToDelete(u); actions.setDeleteOpen(true); }}
                currentUserId={currentUser?.id}
            />

            {/* Dialogs */}
            <UserFormDialog 
                open={state.addOpen} 
                onOpenChange={actions.setAddOpen} 
                editId={state.editId}
                isSaving={state.isSaving}
                form={state.form}
                setForm={actions.setForm}
                contractForm={state.contractForm}
                setContractForm={actions.setContractForm}
                onSave={actions.handlePreSave}
                onCancel={() => { actions.setAddOpen(false); actions.setEditId(null); actions.resetForm(); }}
            />

            <UserDetailsDialog 
                open={state.detailsOpen}
                onOpenChange={actions.setDetailsOpen}
                user={state.selectedUserForDetails}
                contracts={state.userContracts}
                projects={state.projects}
                isLoadingDetails={state.isLoadingDetails}
                isSavingContract={state.isSavingContract}
                isContractEditorOpen={state.isContractEditorOpen}
                editingContractId={state.editingContractId}
                contractForm={state.contractForm}
                setContractForm={actions.setContractForm}
                setIsContractEditorOpen={actions.setIsContractEditorOpen}
                onEditContract={actions.editContract}
                onSaveContract={actions.handleSaveContract}
                onDeleteContract={actions.handleDeleteContract}
                onResetContractForm={actions.resetContractForm}
            />

            <ConfirmDeleteDialog 
                open={state.deleteOpen}
                onOpenChange={(open) => {
                    actions.setDeleteOpen(open);
                    if (!open) actions.setDeleteRelationReasons(null);
                }}
                user={state.userToDelete}
                isDeleting={state.isDeletingUser}
                onConfirm={actions.handleDeleteUser}
                reasons={state.deleteRelationReasons}
                onDeactivate={actions.handleDeactivateUser}
                isDeactivating={state.isDeactivatingUser}
            />

            <ConfirmUserCreationDialog 
                open={state.confirmUserOpen}
                onOpenChange={actions.setConfirmUserOpen}
                type={state.confirmUserType}
                isSaving={state.isSaving}
                onConfirm={actions.handleSaveUser}
            />
        </div>
    );
}

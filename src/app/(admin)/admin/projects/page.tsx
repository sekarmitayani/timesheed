"use client";

import { Plus, FolderKanban } from "lucide-react";
import { ProjectCardsSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { useAdminProjectsData } from "./hooks/useAdminProjectsData";
import { AdminProjectFilters } from "./components/AdminProjectFilters";
import { AdminProjectCard } from "./components/AdminProjectCard";
import { AdminProjectWizard } from "./components/AdminProjectWizard";
import { AdminDeleteProjectDialog } from "./components/AdminDeleteProjectDialog";
import { AdminProjectMembersDialog } from "./components/AdminProjectMembersDialog";

export default function AdminProjectsPage() {
    const { state, actions } = useAdminProjectsData();

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Project Management" 
                description={`Managing ${state.pagination.total} total network projects`}
            >
                <Button 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20 rounded-[6px]" 
                    onClick={() => { actions.resetWizard(); actions.setWizardOpen(true); }}
                >
                    <Plus className="h-4 w-4" /> New Project
                </Button>
            </PageHeader>

            {/* Filters */}
            <AdminProjectFilters 
                search={state.search}
                setSearch={actions.setSearch}
                statusFilter={state.statusFilter}
                setStatusFilter={actions.setStatusFilter}
                filteredCount={state.cards.length}
            />

            {/* Content */}
            {state.isLoading ? (
                <ProjectCardsSkeleton count={6} />
            ) : state.cards.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-60">
                        <div className="bg-slate-100 p-5 rounded-full">
                            <FolderKanban className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {state.search || state.statusFilter !== "All"
                                ? "No projects match your filters."
                                : "No projects in the network yet."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                    {state.cards.map((card) => (
                        <AdminProjectCard 
                            key={card.project.id} 
                            data={card} 
                            onDelete={(p) => { actions.setProjectToDelete(p); actions.setDeleteOpen(true); }}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <AdminProjectWizard 
                open={state.wizardOpen}
                onOpenChange={actions.setWizardOpen}
                step={state.wizardStep}
                setStep={actions.setWizardStep}
                isSaving={state.isSaving}
                form={state.projectForm}
                setForm={actions.setProjectForm}
                selectedPmId={state.selectedPmId}
                setSelectedPmId={actions.setSelectedPmId}
                pendingEmployees={state.pendingEmployees}
                setPendingEmployees={actions.setPendingEmployees}
                allUsers={state.allUsers}
                onSave={actions.handleCreateProject}
            />

            <AdminDeleteProjectDialog 
                open={state.deleteOpen}
                onOpenChange={actions.setDeleteOpen}
                projectName={state.projectToDelete?.name || ""}
                isDeleting={state.isSaving}
                onConfirm={actions.handleDeleteProject}
            />

            <AdminProjectMembersDialog 
                open={state.membersOpen}
                onOpenChange={actions.setMembersOpen}
                project={state.selectedProject}
                members={state.selectedProjectMembers}
                isLoading={state.isLoadingMembers}
                isSaving={state.isSavingMember}
                allUsers={state.allUsers}
                onAssign={actions.handleAssignMember}
                onRemove={actions.handleRemoveMember}
            />
        </div>
    );
}

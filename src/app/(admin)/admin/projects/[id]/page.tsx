"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDetailSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { useAdminProjectDetailData } from "./hooks/useAdminProjectDetailData";
import { AdminProjectHeader } from "./components/AdminProjectHeader";
import { AdminOverviewTab } from "./components/AdminOverviewTab";
import { AdminTeamsTab } from "./components/AdminTeamsTab";
import { AdminCostsTab } from "./components/AdminCostsTab";
import { AdminResourcesTab } from "./components/AdminResourcesTab";
import { AdminProjectDialogs } from "./components/AdminProjectDialogs";
import { cn } from "@/lib/utils";

export default function AdminProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { state, actions } = useAdminProjectDetailData(projectId);

    if (state.isLoading) {
        return <ProjectDetailSkeleton />;
    }

    if (!state.project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Not Found</p>
                <Button variant="outline" onClick={() => router.push("/admin/projects")} className="font-bold">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Network
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full gap-2.5 flex-1 min-h-0 lg:h-full lg:overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="h-8 gap-2 text-slate-500 hover:text-[#2568C1] hover:bg-blue-50 px-2 font-bold"
                        onClick={() => router.push("/admin/projects")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-widest">Back to Projects</span>
                    </Button>

                    <Button
                        size="sm"
                        className="h-8 gap-2 bg-[#2568C1] hover:bg-[#1a4f99] text-white font-bold rounded-[8px] shadow-sm shadow-blue-500/10"
                        onClick={actions.openEditProject}
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Project
                    </Button>
                </div>

                <AdminProjectHeader
                    project={state.project}
                    members={state.members}
                    activeTab={state.activeTab}
                    setActiveTab={actions.setActiveTab}
                />
            </div>

            {/* Content Area (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-3 sm:pb-4 flex flex-col">
                <div className="animate-in fade-in duration-300 flex-1">
                    {state.activeTab === "Overview" && (
                        <AdminOverviewTab
                            project={state.project}
                            members={state.members}
                        />
                    )}

                    {state.activeTab === "Teams" && (
                        <AdminTeamsTab
                            members={state.filteredMembers}
                            search={state.teamSearch}
                            setSearch={actions.setTeamSearch}
                            onAssign={actions.openAssignMember}
                            onRemove={actions.handleRemoveMember}
                            onUpdateRole={actions.handleUpdateMemberRole}
                            isSaving={state.isSaving}
                            projectId={parseInt(projectId)}
                        />
                    )}

                    {state.activeTab === "Costs" && (
                        <AdminCostsTab
                            costs={state.filteredCosts}
                            isLoading={state.isLoadingCosts}
                            filterType={state.costFilterType}
                            setFilterType={actions.setCostFilterType}
                            filterStart={state.costFilterStart}
                            setFilterStart={actions.setCostFilterStart}
                            filterEnd={state.costFilterEnd}
                            setFilterEnd={actions.setCostFilterEnd}
                        />
                    )}

                    {state.activeTab === "Resources" && (
                        <AdminResourcesTab
                            resources={state.filteredResources}
                            search={state.resSearch}
                            setSearch={actions.setResSearch}
                            filterStatus={state.resFilterStatus}
                            setFilterStatus={actions.setResFilterStatus}
                            filterType={state.resFilterType}
                            setFilterType={actions.setResFilterType}
                            onCreate={() => actions.setResCreateOpen(true)}
                            onViewDetail={actions.openResDetail}
                        />
                    )}
                </div>
            </div>

            {/* Consolidated Dialogs */}
            <AdminProjectDialogs state={state} actions={actions} />
        </div>
    );
}

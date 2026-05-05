"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminProjectDetailData } from "./hooks/useAdminProjectDetailData";
import { AdminProjectHeader } from "./components/AdminProjectHeader";
import { AdminOverviewTab } from "./components/AdminOverviewTab";
import { AdminTeamsTab } from "./components/AdminTeamsTab";
import { AdminCostsTab } from "./components/AdminCostsTab";
import { AdminResourcesTab } from "./components/AdminResourcesTab";
import { AdminProjectDialogs } from "./components/AdminProjectDialogs";

export default function AdminProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { state, actions } = useAdminProjectDetailData(projectId);

    if (state.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2568C1] opacity-40" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Intelligence...</p>
                </div>
            </div>
        );
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
        <div className="flex flex-col w-full min-h-screen bg-[#F8FAFC] pb-12">
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6">
                {/* Back Navigation & Main Actions */}
                <div className="flex items-center justify-between py-4">
                    <Button
                        variant="ghost"
                        className="h-9 gap-2 text-slate-500 hover:text-[#2568C1] hover:bg-blue-50 px-2 font-bold"
                        onClick={() => router.push("/admin/projects")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-widest">Back to Projects</span>
                    </Button>

                    <Button
                        size="sm"
                        className="h-9 gap-2 bg-[#2568C1] hover:bg-[#1a4f99] text-white font-bold rounded-[8px] shadow-sm shadow-blue-500/10"
                        onClick={actions.openEditProject}
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Project
                    </Button>
                </div>

                {/* Modern Header Component */}
                <AdminProjectHeader
                    project={state.project}
                    members={state.members}
                    activeTab={state.activeTab}
                    setActiveTab={actions.setActiveTab}
                />

                {/* Tab Content Area */}
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                            isSaving={state.isSaving}
                        />
                    )}

                    {state.activeTab === "Costs" && (
                        <AdminCostsTab
                            costs={state.filteredCosts}
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

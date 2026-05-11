"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePMProjectDetailData } from "./hooks/usePMProjectDetailData";
import { PMProjectHeader } from "./components/PMProjectHeader";
import { PMOverviewTab } from "./components/PMOverviewTab";
import { PMTeamsTab } from "./components/PMTeamsTab";
import { PMTaskViewsContainer } from "./components/PMTaskViewsContainer";
import { PMResourcesTab } from "./components/PMResourcesTab";
import { PMProjectDialogs } from "./components/PMProjectDialogs";
import { cn } from "@/lib/utils";

export default function PMProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { state, actions } = usePMProjectDetailData(projectId);

    if (state.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2568C1] opacity-40" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Project Data...</p>
                </div>
            </div>
        );
    }

    if (!state.project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Not Found</p>
                <Button variant="outline" onClick={() => router.push("/pm/projects")} className="font-bold">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Projects
                </Button>
            </div>
        );
    }

    const isFixedView = ["Kanban", "Calendar"].includes(state.activeTab);

    return (
        <div className="flex flex-col w-full gap-6 h-full overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0 flex flex-col gap-4">
                {/* Back Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="h-9 gap-2 text-slate-500 hover:text-[#2568C1] hover:bg-blue-50 px-2 font-bold"
                        onClick={() => router.push("/pm/projects")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-widest">Back to Projects</span>
                    </Button>
                </div>

                <PMProjectHeader
                    project={state.project}
                    members={state.members}
                    activeTab={state.activeTab}
                    setActiveTab={actions.setActiveTab}
                />
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 min-h-0",
                isFixedView ? "overflow-hidden flex flex-col" : "overflow-y-auto custom-scrollbar pb-6"
            )}>
                <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-500", isFixedView && "flex-1 flex flex-col min-h-0")}>
                    {state.activeTab === "Overview" && (
                        <PMOverviewTab
                            project={state.project}
                            members={state.members}
                            stats={state.stats}
                        />
                    )}

                    {state.activeTab === "Teams" && (
                        <PMTeamsTab
                            members={state.members}
                            search={state.taskSearch}
                            setSearch={actions.setTaskSearch}
                        />
                    )}

                    {["Kanban", "List", "Calendar"].includes(state.activeTab) && (
                        <PMTaskViewsContainer
                            activeTab={state.activeTab}
                            project={state.project}
                            tasks={state.tasks}
                            members={state.members}
                            filteredTasks={state.filteredTasks}
                            search={state.taskSearch}
                            setSearch={actions.setTaskSearch}
                            statusFilter={state.taskFilterStatus}
                            setStatusFilter={actions.setTaskFilterStatus}
                            onCreate={actions.openCreateTask}
                            onEdit={actions.openEditTask}
                            onDelete={(t) => actions.setDeleteTarget({ type: "task", id: t.id, title: t.title })}
                        />
                    )}

                    {state.activeTab === "Resources" && (
                        <PMResourcesTab
                            resources={state.filteredResources}
                            search={state.resSearch}
                            setSearch={actions.setResSearch}
                            filterStatus={state.resFilterStatus}
                            setFilterStatus={actions.setResFilterStatus}
                            onCreate={actions.openCreateRes}
                            onViewDetail={(r) => {
                                actions.setSelectedRes(r);
                                actions.setResDetailOpen(true);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Consolidated Dialogs */}
            <PMProjectDialogs state={state} actions={actions} />
        </div>
    );
}

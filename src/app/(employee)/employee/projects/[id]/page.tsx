"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDetailSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
import { useEmployeeProjectDetailData } from "./hooks/useEmployeeProjectDetailData";
import { ProjectHeader } from "./components/ProjectHeader";
import { OverviewTab } from "./components/OverviewTab";
import { TeamsTab } from "./components/TeamsTab";
import { TaskViewsContainer } from "./components/TaskViewsContainer";
import { TaskFormDialog } from "../../tasks/components/TaskFormDialog";
import { DeleteConfirmDialog } from "../../tasks/components/DeleteConfirmDialog";
import { cn } from "@/lib/utils";

export default function EmployeeProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { state, actions } = useEmployeeProjectDetailData(projectId);

    if (state.isLoading) {
        return <ProjectDetailSkeleton />;
    }

    if (!state.project) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Not Found</p>
                <Button variant="outline" onClick={() => router.push("/employee/projects")} className="font-bold">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Projects
                </Button>
            </div>
        );
    }

    const isFixedView = ["Kanban", "List", "Calendar"].includes(state.activeTab);

    return (
        <div className="flex flex-col w-full gap-2.5 flex-1 min-h-0 lg:h-full lg:overflow-hidden">
            {/* Header Section */}
            <div className="shrink-0 flex flex-col gap-2">
                {/* Back Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        className="h-8 gap-2 text-slate-500 hover:text-[#2568C1] hover:bg-blue-50 px-2 font-bold"
                        onClick={() => router.push("/employee/projects")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-widest">Back to Projects</span>
                    </Button>
                </div>

                <ProjectHeader
                    project={state.project}
                    members={state.members}
                    activeTab={state.activeTab}
                    setActiveTab={actions.setActiveTab}
                />
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 min-h-0 flex flex-col",
                isFixedView ? "lg:overflow-hidden" : "overflow-y-auto custom-scrollbar pr-1 pb-3 sm:pb-4"
            )}>
                <div className={cn("animate-in fade-in duration-300", isFixedView ? "flex-1 flex flex-col min-h-0" : "flex-1")}>
                    {state.activeTab === "Overview" && (
                        <OverviewTab
                            project={state.project}
                            members={state.members}
                            tasks={state.tasks as any[]}
                        />
                    )}

                    {state.activeTab === "Teams" && (
                        <TeamsTab
                            members={state.filteredMembers}
                            totalCount={state.members.length}
                            search={state.taskSearch}
                            setSearch={actions.setTaskSearch}
                        />
                    )}

                    {["Kanban", "List", "Calendar"].includes(state.activeTab) && (
                        <TaskViewsContainer
                            activeTab={state.activeTab}
                            project={state.project}
                            tasks={state.tasks}
                            members={state.members}
                            filteredTasks={state.filteredTasks}
                            search={state.taskSearch}
                            setSearch={actions.setTaskSearch}
                            statusFilter={state.taskFilterStatus}
                            setStatusFilter={actions.setTaskFilterStatus}
                            assigneeFilter={state.taskFilterAssignee}
                            setAssigneeFilter={actions.setTaskFilterAssignee}
                            onTaskClick={actions.handleTaskClick}
                            // Employee Task Detail specific props
                            taskDetailState={state}
                            taskDetailActions={actions}
                        />
                    )}
                </div>
            </div>

            {state.dialogOpen && (
                <TaskFormDialog
                    isOpen={state.dialogOpen}
                    onClose={actions.setDialogOpen}
                    editingTask={state.editingTask}
                    isSaving={state.isSaving}
                    form={state.form}
                    setForm={actions.setForm}
                    onSave={actions.handleSave}
                    projects={state.project ? [state.project] : []}
                    members={state.members}
                    isEmployee={true}
                />
            )}

            <DeleteConfirmDialog
                isOpen={state.deleteOpen}
                onClose={() => actions.setDeleteOpen(false)}
                onConfirm={actions.handleDelete}
                isDeleting={state.isDeleting}
                taskTitle={state.taskToDelete?.title || ""}
                taskId={state.taskToDelete?.id || null}
            />
        </div>
    );
}

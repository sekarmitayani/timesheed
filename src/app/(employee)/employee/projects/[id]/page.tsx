"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeProjectDetailData } from "./hooks/useEmployeeProjectDetailData";
import { ProjectHeader } from "./components/ProjectHeader";
import { OverviewTab } from "./components/OverviewTab";
import { TeamsTab } from "./components/TeamsTab";
import { TaskViewsContainer } from "./components/TaskViewsContainer";
import { TaskFormDialog } from "../../tasks/components/TaskFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function EmployeeProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { state, actions } = useEmployeeProjectDetailData(projectId);

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
                <Button variant="outline" onClick={() => router.push("/employee/projects")} className="font-bold">
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
                "flex-1 min-h-0 pt-1",
                isFixedView ? "overflow-hidden flex flex-col" : "overflow-y-auto custom-scrollbar pb-6"
            )}>
                <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-500 mt-2", isFixedView && "flex-1 flex flex-col min-h-0")}>
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

            <AlertDialog open={state.deleteOpen} onOpenChange={actions.setDeleteOpen}>
                <AlertDialogContent className="bg-white border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-bold text-slate-700">"{state.taskToDelete?.title}"</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-bold border-slate-200 text-slate-500 hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={actions.handleDelete} disabled={state.isDeleting} className="bg-rose-500 hover:bg-rose-600 text-white font-bold">
                            {state.isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

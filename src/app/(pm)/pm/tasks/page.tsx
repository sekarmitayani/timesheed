"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/ai/ai-components";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Circle, PlayCircle, CheckCircle2 } from "lucide-react";
import { usePMTasksData } from "./hooks/usePMTasksData";
import { TaskFilters } from "./components/sections/TaskFilters";
import { TaskKanbanView } from "./components/views/TaskKanbanView";
import { TaskListView } from "./components/views/TaskListView";
import { TaskCalendarView } from "./components/views/TaskCalendarView";

// Dynamic Imports for Modals
const TaskDetailDialog = dynamic(() => import("./components/TaskDetailDialog").then(mod => mod.TaskDetailDialog), { loading: () => null });
const TaskFormDialog = dynamic(() => import("./components/TaskFormDialog").then(mod => mod.TaskFormDialog), { loading: () => null });
const DayTasksDialog = dynamic(() => import("./components/DayTasksDialog").then(mod => mod.DayTasksDialog), { loading: () => null });
const DeleteConfirmDialog = dynamic(() => import("./components/DeleteConfirmDialog").then(mod => mod.DeleteConfirmDialog), { loading: () => null });

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-600 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export default function PMTasksPage() {
    const { state, computed, actions } = usePMTasksData();

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col w-full gap-4 h-[calc(100dvh-115px)] lg:h-[calc(100dvh-120px)] overflow-hidden">
            <PageHeader title="Project Tasks" description={`Monitoring ${state.tasks.length} total assignments`}>
                <Button size="sm" className="gap-2 bg-[#4B7BEC] hover:bg-[#3b60c0] font-bold h-9 rounded-lg shadow-sm" onClick={actions.openCreate}>
                    <Plus className="h-4 w-4" /> New Task
                </Button>
            </PageHeader>

            <TaskFilters 
                isLoadingProjects={state.isLoadingProjects}
                projects={state.projects}
                selectedProjectId={state.selectedProjectId}
                setSelectedProjectId={actions.setSelectedProjectId}
                view={state.view}
                setView={actions.setView}
            />

            {state.isLoadingTasks ? (
                <div className="py-24 flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#4B7BEC] opacity-30" />
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                    {state.view === "kanban" && (
                        <TaskKanbanView 
                            grouped={computed.grouped}
                            onDragEnd={actions.onDragEnd}
                            handleTaskClick={actions.handleTaskClick}
                            getProjectName={actions.getProjectName}
                            allMembers={state.allMembers}
                            currentUserId={state.currentUser?.id ? Number(state.currentUser.id) : undefined}
                            currentUserFullName={state.currentUser?.full_name}
                            statusConfig={statusConfig}
                        />
                    )}
                    
                    {state.view === "list" && (
                        <TaskListView 
                            grouped={computed.grouped}
                            handleTaskClick={actions.handleTaskClick}
                            getProjectName={actions.getProjectName}
                            allMembers={state.allMembers}
                            currentUserId={state.currentUser?.id ? Number(state.currentUser.id) : undefined}
                            currentUserFullName={state.currentUser?.full_name}
                            statusConfig={statusConfig}
                        />
                    )}
                    
                    {state.view === "calendar" && (
                        <TaskCalendarView 
                            calView={state.calView}
                            setCalView={actions.setCalView}
                            currentMonth={state.currentMonth}
                            setCurrentMonth={actions.setCurrentMonth}
                            navigateCalendar={actions.navigateCalendar}
                            calendarDays={computed.calendarDays}
                            weekDays={computed.weekDays}
                            getTasksForDay={actions.getTasksForDay}
                            handleDayClick={actions.handleDayClick}
                            handleTaskClick={actions.handleTaskClick}
                            getProjectColor={actions.getProjectColor}
                            getProjectName={actions.getProjectName}
                            currentTime={state.currentTime}
                            calendarScrollRef={state.calendarScrollRef}
                        />
                    )}
                </div>
            )}

            {/* Modals */}
            {state.detailOpen && (
                <TaskDetailDialog 
                    isOpen={state.detailOpen}
                    onClose={actions.setDetailOpen}
                    selectedTask={state.selectedTask}
                    taskLogs={state.taskLogs}
                    isLoadingLogs={state.isLoadingLogs}
                    canManageTask={computed.canManageTask}
                    onEdit={actions.openEdit}
                    onDelete={actions.openDelete}
                    statusConfig={statusConfig}
                    comments={state.comments}
                    auditLogs={state.auditLogs}
                    reporter={state.reporter}
                    commentText={state.commentText}
                    setCommentText={actions.setCommentText}
                    onSendComment={actions.handleSendComment}
                    isSendingComment={state.isSendingComment}
                    isLoadingActivities={state.isLoadingActivities}
                    onClockIn={async () => {}} // PM doesn't clock in usually, but keeping prop for compat
                    isClockingIn={false}
                    getProjectName={actions.getProjectName}
                    currentUser={state.currentUser}
                    formatDateTime={formatDateTime}
                />
            )}

            {state.dialogOpen && (
                <TaskFormDialog 
                    isOpen={state.dialogOpen}
                    onClose={actions.setDialogOpen}
                    editingTask={state.editingTask}
                    isSaving={state.isSaving}
                    form={state.form}
                    setForm={actions.setForm}
                    onSave={actions.handleSave}
                    projects={state.projects}
                    members={state.members}
                    isEmployee={false}
                />
            )}

            {state.dayTasksOpen && (
                <DayTasksDialog 
                    isOpen={state.dayTasksOpen}
                    onClose={actions.setDayTasksOpen}
                    selectedDate={state.selectedDate}
                    dayTasks={state.selectedDate ? actions.getTasksForDay(state.selectedDate) : []}
                    onTaskClick={actions.handleTaskClick}
                    getProjectName={actions.getProjectName}
                    statusConfig={statusConfig}
                />
            )}

            {state.deleteOpen && (
                <DeleteConfirmDialog 
                    isOpen={state.deleteOpen}
                    onClose={() => actions.setDeleteOpen(false)}
                    onConfirm={actions.handleDelete}
                    isDeleting={state.isDeleting}
                    taskTitle={state.taskToDelete?.title || ""}
                />
            )}
        </div>
    );
}

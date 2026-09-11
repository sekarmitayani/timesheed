"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ApiTask, TaskAuditLog } from "@/lib/services/task-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { Circle, PlayCircle, CheckCircle2, Search, User2 } from "lucide-react";

import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";
import { TaskDetailDialog } from "../../../tasks/components/TaskDetailDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskViewsContainerProps {
    activeTab: string;
    project: ApiProject;
    tasks: ApiTask[];
    members: ProjectMember[];
    filteredTasks: ApiTask[];
    search: string;
    setSearch: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    assigneeFilter: string;
    setAssigneeFilter: (v: string) => void;
    onTaskClick: (t: ApiTask) => void;
    taskDetailState: any;
    taskDetailActions: any;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-600 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function TaskViewsContainer({ 
    activeTab, project, tasks, members, filteredTasks,
    search, setSearch, statusFilter, setStatusFilter,
    assigneeFilter, setAssigneeFilter,
    onTaskClick, taskDetailState, taskDetailActions
}: TaskViewsContainerProps) {
    const { 
        selectedTask, taskDetailOpen, taskLogs, isLoadingLogs, 
        comments, auditLogs, isLoadingActivities, commentText,
        isSendingComment, isClockingIn, currentUser, canManageTask
    } = taskDetailState;

    const { 
        setTaskDetailOpen, setCommentText, handleSendComment, handleClockIn,
        openEdit, openDelete
    } = taskDetailActions;

    const { reporter, assignee, enrichedAuditLogs } = useMemo(() => {
        if (!selectedTask) return { reporter: null, assignee: null, enrichedAuditLogs: [] };
        
        const logs = (auditLogs as TaskAuditLog[]).map((log) => {
            const member = members.find((m) => m.user_id === log.user_id);
            return {
                ...log,
                user: member?.user || (log.user_id === Number(currentUser?.id) ? { full_name: currentUser?.full_name || "You" } : log.user)
            };
        });

        const member = members.find(m => m.user_id === selectedTask.created_by_id);
        const resolvedReporter = member?.user || (selectedTask.created_by_id === Number(currentUser?.id) ? currentUser : null);

        const assigneeMember = members.find(m => m.user_id === selectedTask.assigned_to_id);
        const resolvedAssignee = assigneeMember?.user || (selectedTask.assigned_to_id === Number(currentUser?.id) ? currentUser : null);

        return { enrichedAuditLogs: logs, reporter: resolvedReporter as User | null, assignee: resolvedAssignee as User | null };
    }, [selectedTask, auditLogs, members, currentUser]);

    return (
        <div className="flex flex-col w-full lg:h-full min-h-0">
            {/* Toolbar - Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0 mb-2.5 px-1">
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="relative w-full sm:w-[250px] shrink-0 p-0.5">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate"><SelectValue placeholder="All Assignees" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            {members.map(m => (
                                <SelectItem key={m.user_id} value={String(m.user_id)}>
                                    {m.user?.full_name || `User #${m.user_id}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 min-h-0 animate-in fade-in duration-300 lg:overflow-hidden flex flex-col">
                {activeTab === "Kanban" && (
                    <KanbanView projectId={String(project.id)} tasks={tasks} members={members} onTaskClick={onTaskClick} currentUser={currentUser} />
                )}
                {activeTab === "List" && (
                    <ListView tasks={filteredTasks} members={members} onTaskClick={onTaskClick} currentUser={currentUser} />
                )}
                {activeTab === "Calendar" && (
                    <CalendarView tasks={tasks} onTaskClick={onTaskClick} currentUser={currentUser} />
                )}
            </div>

            <TaskDetailDialog
                isOpen={taskDetailOpen}
                onClose={setTaskDetailOpen}
                selectedTask={selectedTask}
                taskLogs={taskLogs as any}
                isLoadingLogs={isLoadingLogs}
                canManageTask={canManageTask}
                onEdit={openEdit}
                onDelete={openDelete}
                statusConfig={statusConfig}
                comments={comments as any}
                auditLogs={enrichedAuditLogs as any}
                reporter={reporter}
                assignee={assignee}
                commentText={commentText}
                setCommentText={setCommentText}
                onSendComment={handleSendComment}
                isSendingComment={isSendingComment}
                isLoadingActivities={isLoadingActivities}
                onClockIn={handleClockIn}
                isClockingIn={isClockingIn}
                getProjectName={() => project.name}
                currentUser={currentUser}
                formatDateTime={(dateStr) => dateStr ? format(new Date(dateStr), "dd MMM yyyy, HH:mm") : "-"}
            />
        </div>
    );
}

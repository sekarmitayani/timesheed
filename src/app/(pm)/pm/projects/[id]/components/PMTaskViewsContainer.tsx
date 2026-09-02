"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ApiTask, taskService, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Circle, PlayCircle, CheckCircle2, Search, Plus, User2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PMTaskKanbanView } from "./PMTaskKanbanView";
import { PMTaskListView } from "./PMTaskListView";
import { PMTaskCalendarView } from "./PMTaskCalendarView";
import { TaskDetailDialog } from "../../../../../(employee)/employee/tasks/components/TaskDetailDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PMTaskViewsContainerProps {
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
    onCreate: () => void;
    onEdit: (t: ApiTask) => void;
    onDelete: (t: ApiTask) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-600 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function PMTaskViewsContainer({ 
    activeTab, project, tasks, members, filteredTasks,
    search, setSearch, statusFilter, setStatusFilter,
    assigneeFilter, setAssigneeFilter,
    onCreate, onEdit, onDelete
}: PMTaskViewsContainerProps) {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((s) => s.user);

    // Dialog state
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [commentText, setCommentText] = useState("");

    const taskId = selectedTask?.id;

    // --- Queries (Task Detail) ---
    const { data: taskLogs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['task', taskId, 'logs'],
        queryFn: () => timesheetService.getTaskTimesheets(taskId!),
        enabled: !!taskId && dialogOpen,
    });

    const { data: comments = [] } = useQuery({
        queryKey: ['task', taskId, 'comments'],
        queryFn: () => taskService.getTaskComments(taskId!),
        enabled: !!taskId && dialogOpen,
    });

    const { data: auditLogsRaw = [], isLoading: isLoadingActivities } = useQuery({
        queryKey: ['task', taskId, 'audit'],
        queryFn: () => taskService.getTaskLogs(taskId!),
        enabled: !!taskId && dialogOpen,
    });

    const { auditLogs, reporter, assignee } = useMemo(() => {
        if (!selectedTask) return { auditLogs: [], reporter: null, assignee: null };
        
        const enrichedAuditLogs = auditLogsRaw.map((log: TaskAuditLog) => {
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

        return { auditLogs: enrichedAuditLogs, reporter: resolvedReporter as User | null, assignee: resolvedAssignee as User | null };
    }, [selectedTask, auditLogsRaw, members, currentUser]);

    // --- Mutations ---
    const commentMutation = useMutation({
        mutationFn: (text: string) => taskService.addTaskComment(taskId!, text),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId, 'comments'] });
            setCommentText("");
        },
        onSuccess: () => {
            toast.success("Comment added");
        }
    });

    const clockInMutation = useMutation({
        mutationFn: async () => {
            if (selectedTask!.status !== "in_progress") {
                await taskService.updateTaskStatus(selectedTask!.id, { status: "in_progress" });
            }
            return timesheetService.clockIn({ project_id: selectedTask!.project_id, task_id: selectedTask!.id });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['pm', 'project', String(project.id), 'tasks'] });
            queryClient.invalidateQueries({ queryKey: ['employee', 'timesheets'] });
            queryClient.invalidateQueries({ queryKey: ['employee', 'timesheets', 'logs'] });
            setDialogOpen(false);
        },
        onSuccess: () => {
            toast.success("Clocked in successfully");
        }
    });

    const handleTaskClick = (task: ApiTask) => {
        setSelectedTask(task);
        setDialogOpen(true);
    };

    const handleSendComment = async () => {
        if (commentText.trim()) commentMutation.mutate(commentText);
    };

    const handleClockIn = async () => {
        clockInMutation.mutate();
    };

    return (
        <div className="flex flex-col w-full h-full min-h-0">
            {/* Toolbar - Search/Filter/Add */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0 mb-5 px-1">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
                    <div className="relative w-full sm:w-[250px] shrink-0">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
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

                <Button size="sm" className="h-10 gap-2 bg-[#2568C1] hover:bg-[#1a4f99] font-bold px-4 rounded-[6px] shrink-0 w-full sm:w-auto" onClick={onCreate}>
                    <Plus className="h-4 w-4" /> Add Task
                </Button>
            </div>
            
            {/* Views Content */}
            <div className="flex-1 min-h-0 animate-in fade-in duration-300 overflow-hidden flex flex-col">
                {activeTab === "Kanban" && (
                    <PMTaskKanbanView projectId={String(project.id)} tasks={tasks} members={members} onTaskClick={handleTaskClick} onEdit={onEdit} onDelete={onDelete} />
                )}
                {activeTab === "List" && (
                    <PMTaskListView tasks={filteredTasks} members={members} onTaskClick={handleTaskClick} statusConfig={statusConfig} currentUser={currentUser} />
                )}
                {activeTab === "Calendar" && (
                    <PMTaskCalendarView tasks={tasks} onTaskClick={handleTaskClick} />
                )}
            </div>

            <TaskDetailDialog
                isOpen={dialogOpen}
                onClose={setDialogOpen}
                selectedTask={selectedTask}
                taskLogs={taskLogs as any}
                isLoadingLogs={isLoadingLogs}
                canManageTask={true}
                onEdit={onEdit}
                onDelete={onDelete}
                statusConfig={statusConfig}
                comments={comments as any}
                auditLogs={auditLogs as any}
                reporter={reporter}
                assignee={assignee}
                commentText={commentText}
                setCommentText={setCommentText}
                onSendComment={handleSendComment}
                isSendingComment={commentMutation.isPending}
                isLoadingActivities={isLoadingActivities}
                onClockIn={handleClockIn}
                isClockingIn={clockInMutation.isPending}
                getProjectName={() => project.name}
                currentUser={currentUser}
                formatDateTime={(dateStr) => dateStr ? format(new Date(dateStr), "dd MMM yyyy, HH:mm") : "-"}
            />
        </div>
    );
}

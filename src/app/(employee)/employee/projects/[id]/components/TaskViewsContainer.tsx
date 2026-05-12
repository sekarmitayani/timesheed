"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ApiTask, taskService, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Circle, PlayCircle, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";
import { TaskDetailDialog } from "../../../tasks/components/TaskDetailDialog";

interface TaskViewsContainerProps {
    activeTab: string;
    project: ApiProject;
    tasks: ApiTask[];
    members: ProjectMember[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-600 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function TaskViewsContainer({ activeTab, project, tasks, members }: TaskViewsContainerProps) {
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
            queryClient.invalidateQueries({ queryKey: ['project', String(project.id), 'tasks'] });
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
            {activeTab === "Kanban" && (
                <KanbanView projectId={String(project.id)} tasks={tasks} members={members} onTaskClick={handleTaskClick} />
            )}
            {activeTab === "List" && (
                <ListView tasks={tasks} members={members} onTaskClick={handleTaskClick} />
            )}
            {activeTab === "Calendar" && (
                <CalendarView tasks={tasks} onTaskClick={handleTaskClick} />
            )}

            <TaskDetailDialog
                isOpen={dialogOpen}
                onClose={setDialogOpen}
                selectedTask={selectedTask}
                taskLogs={taskLogs as any}
                isLoadingLogs={isLoadingLogs}
                canManageTask={false}
                onEdit={() => {}}
                onDelete={() => {}}
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

"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ApiTask, taskService, TaskComment, TaskAuditLog } from "@/lib/services/task-service";
import { timesheetService, TimesheetLog } from "@/lib/services/timesheet-service";
import { ApiProject, ProjectMember, User } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Circle, PlayCircle, CheckCircle2 } from "lucide-react";

import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";
import { TaskDetailDialog } from "../../../tasks/components/TaskDetailDialog";

interface TaskViewsContainerProps {
    activeTab: string;
    project: ApiProject;
    tasks: ApiTask[];
    members: ProjectMember[];
    setTasks: React.Dispatch<React.SetStateAction<ApiTask[]>>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; border: string; badge: string }> = {
    todo: { label: "To Do", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-50 text-slate-600 border-slate-200", icon: <Circle className="h-3.5 w-3.5" /> },
    in_progress: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: <PlayCircle className="h-3.5 w-3.5" /> },
    done: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function TaskViewsContainer({ activeTab, project, tasks, members, setTasks }: TaskViewsContainerProps) {
    const currentUser = useAuthStore((s) => s.user);

    // Dialog state
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [taskLogs, setTaskLogs] = useState<TimesheetLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(false);

    const selectedReporter = useMemo(() => {
        if (!selectedTask) return null;
        const member = members.find(m => m.user_id === selectedTask.created_by_id);
        if (member?.user) return member.user as unknown as User;
        if (selectedTask.created_by_id === Number(currentUser?.id)) return currentUser;
        return null;
    }, [selectedTask, members, currentUser]);

    const getProjectName = () => project.name;

    const handleTaskClick = async (task: ApiTask) => {
        setSelectedTask(task);
        setDialogOpen(true);
        
        setIsLoadingLogs(true);
        setIsLoadingActivities(true);
        try {
            const [logsRes, commentsRes, auditRes] = await Promise.all([
                timesheetService.getTaskTimesheets(task.id).catch(() => []),
                taskService.getTaskComments(task.id).catch(() => []),
                taskService.getTaskLogs(task.id).catch(() => [])
            ]);
            setTaskLogs(Array.isArray(logsRes) ? logsRes : []);
            setComments(Array.isArray(commentsRes) ? commentsRes : []);
            const enrichedAuditLogs = (Array.isArray(auditRes) ? auditRes : []).map((log) => {
                if (!log.user) {
                    const member = members.find((m) => m.user_id === log.user_id);
                    if (member?.user) {
                        return { ...log, user: member.user };
                    }
                }
                return log;
            });
            setAuditLogs(enrichedAuditLogs);
        } catch (error) {
            console.error("Failed to load task details", error);
        } finally {
            setIsLoadingLogs(false);
            setIsLoadingActivities(false);
        }
    };

    const handleSendComment = async () => {
        if (!selectedTask || !commentText.trim()) return;
        setIsSendingComment(true);
        try {
            const newComment = await taskService.addTaskComment(selectedTask.id, commentText);
            setComments([newComment, ...comments]);
            setCommentText("");
        } catch (e: any) {
            toast.error("Failed to send comment");
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleClockIn = async () => {
        if (!selectedTask) return;
        setIsClockingIn(true);
        try {
            await timesheetService.clockIn({ project_id: selectedTask.project_id, task_id: selectedTask.id });
            toast.success("Clocked in successfully");
            setDialogOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to clock in");
        } finally {
            setIsClockingIn(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-full min-h-0">
            {activeTab === "Kanban" && (
                <KanbanView tasks={tasks} members={members} setTasks={setTasks} onTaskClick={handleTaskClick} />
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
                taskLogs={taskLogs}
                isLoadingLogs={isLoadingLogs}
                canManageTask={false}
                onEdit={() => {}}
                onDelete={() => {}}
                statusConfig={statusConfig}
                comments={comments}
                auditLogs={auditLogs}
                reporter={selectedReporter}
                commentText={commentText}
                setCommentText={setCommentText}
                onSendComment={handleSendComment}
                isSendingComment={isSendingComment}
                isLoadingActivities={isLoadingActivities}
                onClockIn={handleClockIn}
                isClockingIn={isClockingIn}
                getProjectName={getProjectName}
                currentUser={currentUser}
                formatDateTime={(dateStr) => dateStr ? format(new Date(dateStr), "dd MMM yyyy, HH:mm") : "-"}
            />
        </div>
    );
}

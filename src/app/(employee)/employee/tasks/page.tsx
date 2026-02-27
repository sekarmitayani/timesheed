"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ai/ai-components";
import { getPriorityBadgeClasses } from "@/lib/priority-utils";
import { useDataStore } from "@/store/useDataStore";
import { useAuthStore } from "@/store/useAuthStore";
import { GripVertical, Play, Square, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

const statusColumns: { key: "todo" | "in-progress" | "review" | "done"; label: string; color: string; bg: string }[] = [
    { key: "todo", label: "To Do", color: "text-muted-foreground", bg: "bg-muted/30" },
    { key: "in-progress", label: "In Progress", color: "text-blue-500", bg: "bg-blue-500/5" },
    { key: "review", label: "Review", color: "text-amber-500", bg: "bg-amber-500/5" },
    { key: "done", label: "Done", color: "text-emerald-500", bg: "bg-emerald-500/5" },
];

function formatElapsed(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TimerDisplay({ startedAt }: { startedAt: number }) {
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    return (
        <span className="font-mono text-[10px] text-[#FFBE18] font-bold">
            {formatElapsed(Date.now() - startedAt)}
        </span>
    );
}

export default function TasksPage() {
    const user = useAuthStore((s) => s.user);
    const tasks = useDataStore((s) => s.tasks);
    const projects = useDataStore((s) => s.projects);
    const moveTask = useDataStore((s) => s.moveTask);
    const activeTimers = useDataStore((s) => s.activeTimers);
    const startTimer = useDataStore((s) => s.startTimer);
    const stopTimer = useDataStore((s) => s.stopTimer);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const myTasks = tasks.filter((t) => t.assigneeId === user?.id);

    const onDragEnd = useCallback((result: DropResult) => {
        const { draggableId, destination } = result;
        if (!destination) return;
        const newStatus = destination.droppableId as "todo" | "in-progress" | "review" | "done";
        const task = myTasks.find((t) => t.id === draggableId);
        if (!task || task.status === newStatus) return;
        moveTask(draggableId, newStatus);
        const colLabel = statusColumns.find((c) => c.key === newStatus)?.label;
        toast.success(`"${task.title}" → ${colLabel}`);
    }, [myTasks, moveTask]);

    const handleStartTimer = (taskId: string, title: string) => {
        startTimer(taskId);
        toast.success(`Timer started for "${title}"`, { description: "Tracks even when you navigate away" });
    };

    const handleStopTimer = (taskId: string, title: string) => {
        if (!user) return;
        const timer = activeTimers.find((t) => t.taskId === taskId);
        if (timer) {
            const elapsed = (Date.now() - timer.startedAt) / 3600000;
            const roundedHours = Math.max(0.1, Math.round(elapsed * 10) / 10);
            stopTimer(taskId, user.id);
            toast.success(`Timer stopped for "${title}"`, {
                description: `${roundedHours}h logged → added to timesheet as draft`,
            });
        }
    };

    const activeTimerCount = activeTimers.filter((t) => myTasks.some((mt) => mt.id === t.taskId)).length;

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <PageHeader title="My Tasks" description={`${myTasks.length} tasks · drag cards between columns`}>
                {activeTimerCount > 0 && (
                    <Badge className="bg-[#FFBE18]/10 text-[#FFBE18] border-[#FFBE18]/30 gap-1 animate-pulse">
                        <Clock className="h-3 w-3" /> {activeTimerCount} timer{activeTimerCount > 1 ? "s" : ""} running
                    </Badge>
                )}
            </PageHeader>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {statusColumns.map((col) => {
                        const colTasks = myTasks.filter((t) => t.status === col.key);
                        return (
                            <div key={col.key} className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                                    <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                                </div>

                                <Droppable droppableId={col.key}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`space-y-2 min-h-[200px] p-2 rounded-xl border-2 border-dashed transition-colors ${snapshot.isDraggingOver
                                                ? "border-[#FFBE18]/50 bg-[#FFBE18]/5"
                                                : "border-transparent"
                                                }`}
                                        >
                                            {colTasks.map((task, index) => {
                                                const project = projects.find((p) => p.id === task.projectId);
                                                const progress = task.estimatedHours > 0 ? Math.round((task.loggedHours / task.estimatedHours) * 100) : 0;
                                                const activeTimer = activeTimers.find((t) => t.taskId === task.id);
                                                const isTimerRunning = !!activeTimer;

                                                return (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                <Card className={`transition-all ${snapshot.isDragging
                                                                    ? "shadow-xl shadow-[#FFBE18]/20 rotate-2 scale-105 border-[#FFBE18]/50"
                                                                    : isTimerRunning
                                                                        ? "border-[#FFBE18]/50 shadow-[0_0_12px_rgba(255,190,24,0.15)]"
                                                                        : "hover:border-[#FFBE18]/30"
                                                                    }`}>
                                                                    <CardContent className="p-3 space-y-2">
                                                                        <div className="flex items-start gap-2">
                                                                            <div {...provided.dragHandleProps} className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing">
                                                                                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-[#FFBE18] transition-colors" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium truncate">{task.title}</p>
                                                                                <p className="text-xs text-muted-foreground">{project?.name}</p>
                                                                            </div>
                                                                        </div>

                                                                        {isTimerRunning && activeTimer && (
                                                                            <div className="flex items-center gap-2 p-1.5 rounded-md bg-[#FFBE18]/10 border border-[#FFBE18]/20">
                                                                                <div className="h-2 w-2 rounded-full bg-[#FFBE18] animate-pulse" />
                                                                                <TimerDisplay startedAt={activeTimer.startedAt} />
                                                                                <span className="text-[10px] text-muted-foreground ml-auto">tracking</span>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <Badge variant="outline" className={`text-[10px] ${getPriorityBadgeClasses(task.priority)}`}>
                                                                                {task.priority}
                                                                            </Badge>
                                                                            <span className="text-muted-foreground">{task.loggedHours}/{task.estimatedHours}h</span>
                                                                        </div>
                                                                        <div className="w-full bg-muted rounded-full h-1.5">
                                                                            <div className="bg-[#FFBE18] h-1.5 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                                                                        </div>

                                                                        <div className="flex gap-1 pt-1">
                                                                            {col.key !== "done" ? (
                                                                                isTimerRunning ? (
                                                                                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={() => handleStopTimer(task.id, task.title)}>
                                                                                        <Square className="h-2.5 w-2.5 fill-current" /> Stop Timer
                                                                                    </Button>
                                                                                ) : (
                                                                                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 flex-1 border-[#FFBE18]/30 text-[#FFBE18] hover:bg-[#FFBE18]/10" onClick={() => handleStartTimer(task.id, task.title)}>
                                                                                        <Play className="h-2.5 w-2.5 fill-current" /> Track Time
                                                                                    </Button>
                                                                                )
                                                                            ) : (
                                                                                <span className="text-[10px] text-emerald-500 flex items-center gap-1"><FileText className="h-3 w-3" /> {task.loggedHours}h logged</span>
                                                                            )}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}

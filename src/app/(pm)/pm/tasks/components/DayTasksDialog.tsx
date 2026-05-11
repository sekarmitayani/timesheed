"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ApiTask } from "@/lib/services/task-service";

interface DayTasksDialogProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    selectedDate: Date | null;
    dayTasks: ApiTask[];
    onTaskClick: (task: ApiTask) => void;
    getProjectName: (id: number) => string;
    statusConfig: Record<string, { label: string; badge: string }>;
}

export function DayTasksDialog({
    isOpen,
    onClose,
    selectedDate,
    dayTasks,
    onTaskClick,
    getProjectName,
    statusConfig
}: DayTasksDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[380px] rounded-md p-0 overflow-hidden border-none shadow-2xl bg-white text-slate-900">
                <DialogDescription className="sr-only">List of tasks for the selected day.</DialogDescription>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#4B7BEC]" /> 
                        {selectedDate && format(selectedDate, "MMMM d, yyyy")}
                    </DialogTitle>
                </div>
                <div className="p-4 max-h-[350px] overflow-y-auto space-y-2.5">
                    {selectedDate && dayTasks.length === 0 ? (
                        <p className="text-center py-12 text-slate-300 font-bold text-[10px] uppercase">No Assignments</p>
                    ) : (
                        selectedDate && dayTasks.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => { onClose(false); onTaskClick(task); }} 
                                className="p-4 rounded-md border border-slate-100 hover:border-[#4B7BEC]/30 hover:bg-blue-50/30 transition-all cursor-pointer group shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <Badge variant="outline" className={`${statusConfig[task.status].badge} text-[8px] font-black px-2 py-0 rounded-full uppercase`}>
                                        {statusConfig[task.status].label}
                                    </Badge>
                                    <span className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[120px]">
                                        {getProjectName(task.project_id)}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 group-hover:text-[#4B7BEC] line-clamp-1">{task.title}</p>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

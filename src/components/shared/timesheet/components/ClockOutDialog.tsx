"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiProject } from "@/lib/types";
import { ApiTask } from "@/lib/services/task-service";

interface ClockOutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isClocking: boolean;
    clockOutTitle: string;
    setClockOutTitle: (title: string) => void;
    clockOutDesc: string;
    setClockOutDesc: (desc: string) => void;
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    projects: ApiProject[];
    projectTasks: ApiTask[];
    isLoadingProjectTasks?: boolean;
    onClockOut: () => Promise<void>;
}

export function ClockOutDialog({
    open,
    onOpenChange,
    isClocking,
    clockOutTitle,
    setClockOutTitle,
    clockOutDesc,
    setClockOutDesc,
    selectedProjectId,
    setSelectedProjectId,
    selectedTaskId,
    setSelectedTaskId,
    projects,
    projectTasks,
    isLoadingProjectTasks,
    onClockOut
}: ClockOutDialogProps) {
    const hasProjectSelected = selectedProjectId && selectedProjectId !== "none";

    return (
        <Dialog open={open} onOpenChange={o => !isClocking && onOpenChange(o)}>
            <DialogContent 
                className="sm:max-w-[520px] p-0 overflow-hidden border-[#e2e8f0] rounded-md gap-0"
            >
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 flex flex-col gap-1">
                    <DialogTitle className="text-xl text-[#0f172a] flex items-center gap-2">
                        <StopCircle className="h-5 w-5 text-red-600 shrink-0" />
                        Clock Out
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Review your session details and submit your work summary to complete clock out.
                    </DialogDescription>
                </div>

                <div className="px-6 pt-3.5 pb-5 space-y-4 max-h-[65vh] overflow-y-auto">
                    {/* Session Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">
                            Session Title <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <Input 
                            value={clockOutTitle} 
                            onChange={e => setClockOutTitle(e.target.value)} 
                            placeholder="e.g. Daily Attendance / Feature Implementation" 
                            disabled={isClocking}
                            className="bg-white"
                        />
                    </div>

                    {/* Project Assignment */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">
                            Assign to Project <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <Select 
                            value={selectedProjectId} 
                            onValueChange={(val) => { 
                                setSelectedProjectId(val); 
                                setSelectedTaskId("none"); 
                            }}
                            disabled={isClocking}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Daily Attendance / No Project)</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Task Assignment */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">
                            Assign to Task <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <Select 
                            value={selectedTaskId} 
                            onValueChange={setSelectedTaskId}
                            disabled={isClocking || !hasProjectSelected || isLoadingProjectTasks}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder={!hasProjectSelected ? "Select a project first" : (isLoadingProjectTasks ? "Loading tasks..." : "Select Task")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (General project work)</SelectItem>
                                {projectTasks.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Session Summary / Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0f172a]">
                            Session Summary <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            value={clockOutDesc} 
                            onChange={e => setClockOutDesc(e.target.value)} 
                            placeholder="Describe what you have accomplished during this session..." 
                            disabled={isClocking}
                            rows={3}
                            className="w-full p-3 text-sm border border-input rounded-md bg-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        className="text-[#64748b] hover:text-[#0f172a]" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isClocking}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => {
                            if (!clockOutDesc.trim()) {
                                toast.error("Please fill in Session Summary");
                                return;
                            }
                            onClockOut();
                        }} 
                        disabled={isClocking} 
                        className="bg-red-600 hover:bg-red-700 text-white min-w-[130px] font-semibold shadow-sm"
                    >
                        {isClocking ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                                Saving...
                            </>
                        ) : "Submit & Clock Out"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, StopCircle } from "lucide-react";
import { TimesheetLog } from "@/lib/services/timesheet-service";

interface ActiveSessionBannerProps {
    activeLog: TimesheetLog | undefined;
    liveElapsed: string;
    onClockOut: () => void;
    getTaskTitle: (taskId: number | null) => string;
    formatTime24: (dateStr: string | null) => string;
}

export function ActiveSessionBanner({
    activeLog,
    liveElapsed,
    onClockOut,
    getTaskTitle,
    formatTime24
}: ActiveSessionBannerProps) {
    if (!activeLog) return null;

    return (
        <Card className="border-[#E2E8F0] bg-white rounded-[6px] shadow-none shrink-0 overflow-hidden">
            <CardContent className="p-0">
                {/* Top Row: Date + Task Info + Clock Out */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                    {/* Date Block */}
                    <div className="flex flex-row sm:flex-col items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-2 min-w-[60px] gap-2 sm:gap-0">
                        <span className="text-[10px] font-bold text-[#4B7BEC] uppercase tracking-wide leading-none">
                            {new Date(activeLog.clock_in).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-[#0f172a] leading-tight">
                            {new Date(activeLog.clock_in).getDate()}
                        </span>
                    </div>

                    {/* Task & Project Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Active Session</span>
                        </div>
                        <p className="text-sm font-bold text-[#0f172a] truncate">
                            {getTaskTitle(activeLog.task_id)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground font-medium">
                                {activeLog.project?.name || `Project #${activeLog.project_id}`}
                            </span>
                        </div>
                    </div>

                    {/* Clock Out Button */}
                    <Button
                        className="gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-none border-none rounded-[4px] px-5 h-10 font-bold text-xs w-full sm:w-auto"
                        onClick={onClockOut}
                    >
                        <StopCircle className="h-4 w-4" /> Clock Out
                    </Button>
                </div>

                {/* Separator */}
                <div className="border-t border-[#E2E8F0]" />

                {/* Bottom Row: Clock In & Duration */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 px-4 py-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Clock In</span>
                        <span className="text-sm font-bold text-[#0f172a]">{formatTime24(activeLog.clock_in)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Duration</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#4B7BEC] tabular-nums">{liveElapsed}</span>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4B7BEC] opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4B7BEC]" />
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

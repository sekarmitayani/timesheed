import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, StopCircle, Pause, Play, Loader2 } from "lucide-react";
import { TimesheetLog } from "@/lib/services/timesheet-service";

interface ActiveSessionBannerProps {
    activeLog: TimesheetLog | undefined;
    liveElapsed: string;
    onClockOut: () => void;
    onClockIn?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    isClockingIn?: boolean;
    isPausing?: boolean;
    isResuming?: boolean;
    getTaskTitle: (taskId: number | null) => string;
    formatTime24: (dateStr: string | null) => string;
}

export function ActiveSessionBanner({
    activeLog,
    liveElapsed,
    onClockOut,
    onClockIn,
    onPause,
    onResume,
    isClockingIn = false,
    isPausing = false,
    isResuming = false,
    getTaskTitle,
    formatTime24
}: ActiveSessionBannerProps) {
    if (!activeLog) {
        return (
            <Card className="bg-white rounded-[6px] shadow-none shrink-0 overflow-hidden border-[#E2E8F0]">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex flex-col items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-2 min-w-[56px] shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                                {new Date().toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#0f172a] leading-tight mt-0.5">
                                {new Date().getDate()}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="inline-flex rounded-full h-2 w-2 bg-slate-300" />
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    No Active Session
                                </span>
                            </div>
                            <p className="text-sm font-bold text-[#0f172a]">
                                Ready to start your work?
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Click Clock In to record your daily attendance and start tracking your productivity.
                            </p>
                        </div>
                    </div>

                    {onClockIn && (
                        <Button
                            onClick={onClockIn}
                            disabled={isClockingIn}
                            className="w-full sm:w-auto gap-2 bg-[#4B7BEC] hover:bg-[#385bb5] text-white shadow-none border-none rounded-[4px] px-5 h-10 font-bold text-xs transition-all shrink-0"
                        >
                            {isClockingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                            Clock In
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    const isPaused = !!activeLog.is_paused;

    return (
        <Card className={`bg-white rounded-[6px] shadow-none shrink-0 overflow-hidden transition-all ${
            isPaused ? "border-amber-300 ring-1 ring-amber-100" : "border-[#E2E8F0]"
        }`}>
            <CardContent className="p-0">
                {/* Top Row: Date + Task Info + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    {/* Left: Date Block + Task Info */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        {/* Date Block */}
                        <div className="flex flex-col items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-2 min-w-[56px] shrink-0">
                            <span className="text-[10px] font-bold text-[#4B7BEC] uppercase tracking-wide leading-none">
                                {new Date(activeLog.clock_in).toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#0f172a] leading-tight mt-0.5">
                                {new Date(activeLog.clock_in).getDate()}
                            </span>
                        </div>

                        {/* Task & Project Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {isPaused ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                        </span>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                                            Session Paused
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                            Active Session
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm font-bold text-[#0f172a] truncate">
                                {activeLog.title || getTaskTitle(activeLog.task_id)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[11px] text-muted-foreground font-medium truncate">
                                    {activeLog.project?.name || (activeLog.project_id ? `Project #${activeLog.project_id}` : "Daily Timesheet (No Project)")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                        {isPaused ? (
                            <Button
                                className="w-full sm:w-auto gap-2 bg-[#4B7BEC] hover:bg-[#385bb5] text-white shadow-none border-none rounded-[4px] px-4 h-10 font-bold text-xs transition-all"
                                onClick={onResume}
                                disabled={isResuming}
                            >
                                {isResuming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                Resume
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto gap-2 border-[#E2E8F0] hover:bg-slate-50 text-slate-700 shadow-none rounded-[4px] px-4 h-10 font-bold text-xs transition-all"
                                onClick={onPause}
                                disabled={isPausing}
                            >
                                {isPausing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4 fill-current" />}
                                Pause
                            </Button>
                        )}

                        <Button
                            className="w-full sm:w-auto gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-none border-none rounded-[4px] px-4 sm:px-5 h-10 font-bold text-xs transition-all"
                            onClick={onClockOut}
                        >
                            <StopCircle className="h-4 w-4" /> Clock Out
                        </Button>
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-[#E2E8F0]" />

                {/* Bottom Row: Clock In & Duration */}
                <div className="flex flex-row items-center gap-6 sm:gap-8 px-4 py-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Clock In</span>
                        <span className="text-sm font-bold text-[#0f172a]">{formatTime24(activeLog.clock_in)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                            {isPaused ? "Duration (Frozen)" : "Duration"}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold tabular-nums ${isPaused ? "text-amber-600" : "text-[#4B7BEC]"}`}>
                                {liveElapsed}
                            </span>
                            {!isPaused && (
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4B7BEC] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4B7BEC]" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

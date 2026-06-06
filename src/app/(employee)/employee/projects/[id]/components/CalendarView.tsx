"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
    addWeeks, subWeeks, addDays, subDays, getHours, getMinutes, isToday 
} from "date-fns";
import { ApiTask } from "@/lib/services/task-service";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
    tasks: ApiTask[];
    onTaskClick: (task: ApiTask) => void;
    currentUser: User | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64;
const WEEK_HEADER_HEIGHT = 52;
const EXTRA_PADDING = 20;

const STATUS_COLORS: Record<string, { bg: string; text: string; borderL: string; dot: string }> = {
    todo: { bg: "bg-slate-50", text: "text-slate-700", borderL: "border-l-slate-400", dot: "bg-slate-400" },
    in_progress: { bg: "bg-blue-50", text: "text-blue-700", borderL: "border-l-blue-400", dot: "bg-blue-400" },
    done: { bg: "bg-emerald-50", text: "text-emerald-700", borderL: "border-l-emerald-400", dot: "bg-emerald-400" },
};

export function CalendarView({ tasks, onTaskClick, currentUser }: CalendarViewProps) {
    const [calView, setCalView] = useState<"day" | "week" | "month">("month");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const calendarScrollRef = useRef<HTMLDivElement>(null);

    // Update current time every minute for the red line indicator
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll to current hour when switching to day or week view
    useEffect(() => {
        if ((calView === "day" || calView === "week") && calendarScrollRef.current) {
            const scroll = () => {
                const now = new Date();
                const headerH = calView === "week" ? WEEK_HEADER_HEIGHT : 0;
                const topOffset = headerH + EXTRA_PADDING;
                const scrollTarget = topOffset + (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60) - 150;
                calendarScrollRef.current?.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
            };
            scroll();
            setTimeout(scroll, 50);
            setTimeout(scroll, 300);
        }
    }, [calView, currentMonth]);

    const getStatusColor = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.todo;

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
    }, [currentMonth]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentMonth);
        return eachDayOfInterval({ start, end: endOfWeek(start) });
    }, [currentMonth]);

    const getTasksForDay = (day: Date) => tasks.filter(t => isSameDay(day, t.due_date ? new Date(t.due_date) : new Date(t.created_at)));

    const navigateCalendar = (dir: "prev" | "next") => {
        if (calView === "month") setCurrentMonth(dir === "next" ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
        else if (calView === "week") setCurrentMonth(dir === "next" ? addWeeks(currentMonth, 1) : subWeeks(currentMonth, 1));
        else setCurrentMonth(dir === "next" ? addDays(currentMonth, 1) : subDays(currentMonth, 1));
    };

    const getTaskStyle = (task: ApiTask, dayTasks: ApiTask[]) => {
        const date = new Date(task.created_at);
        const h = getHours(date);
        const m = getMinutes(date);
        const top = (h * 60 + m) * (HOUR_HEIGHT / 60);
        const sameHourTasks = dayTasks.filter(t => getHours(new Date(t.created_at)) === h);
        const overlapIndex = sameHourTasks.findIndex(t => t.id === task.id);
        const overlapCount = sameHourTasks.length;
        if (overlapCount > 1) {
            const widthPercent = 100 / overlapCount;
            return { top: `${top}px`, width: `calc(${widthPercent}% - 4px)`, left: `calc(${overlapIndex * widthPercent}% + 2px)`, right: 'auto' };
        }
        return { top: `${top}px` };
    };

    const HEADER_HEIGHT = calView === "week" ? WEEK_HEADER_HEIGHT : 0;

    return (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col shadow-sm flex-1 min-h-0">
            {/* Calendar toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white shrink-0 z-20">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {calView === "day"
                        ? format(currentMonth, "EEEE, MMMM d, yyyy")
                        : calView === "week"
                            ? `${format(startOfWeek(currentMonth), "MMM d")} – ${format(endOfWeek(currentMonth), "MMM d, yyyy")}`
                            : format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#2568C1] hover:bg-white rounded-md" onClick={() => navigateCalendar("prev")}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 px-4 text-[10px] font-bold uppercase text-slate-500 hover:text-[#2568C1] hover:bg-white rounded-md tracking-widest" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#2568C1] hover:bg-white rounded-md" onClick={() => navigateCalendar("next")}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-0.5 rounded-md flex shrink-0">
                        {(["day", "week", "month"] as const).map(v => (
                            <Button
                                key={v}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-7 px-4 text-[10px] font-bold uppercase transition-all rounded-md tracking-widest",
                                    calView === v
                                        ? "bg-white text-[#2568C1] shadow-sm border border-slate-200"
                                        : "text-slate-400 hover:text-slate-600 border border-transparent"
                                )}
                                onClick={() => setCalView(v)}
                            >
                                {v}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable calendar body */}
            <div ref={calendarScrollRef} className="flex-1 overflow-auto relative min-h-0 custom-scrollbar">
                {/* ========== MONTH VIEW ========== */}
                {calView === "month" && (
                    <div className="flex flex-col min-w-[800px]">
                        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <div key={day} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 divide-x divide-slate-100 border-l border-slate-100">
                            {calendarDays.map((day, idx) => {
                                const dayTasks = getTasksForDay(day);
                                return (
                                    <div key={idx} className={cn("min-h-[130px] p-1.5 bg-white transition-colors cursor-pointer border-b border-slate-100", !isSameMonth(day, currentMonth) ? "bg-slate-50/40" : "hover:bg-blue-50/20")}>
                                        <div className="flex items-center justify-center mb-1">
                                            <span className={cn("text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#2568C1] text-white shadow-md shadow-blue-200" : isSameMonth(day, currentMonth) ? "text-slate-700" : "text-slate-300")}>{format(day, "d")}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {dayTasks.slice(0, 3).map(task => { 
                                                const sColor = getStatusColor(task.status); 
                                                const isAssignedToMe = currentUser && String(task.assigned_to_id) === String(currentUser.id);
                                                return (
                                                    <div 
                                                        key={task.id} 
                                                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} 
                                                        className={cn(
                                                            "flex items-center gap-1 px-1.5 py-1 rounded-[4px] text-[9px] font-bold truncate transition-all hover:shadow-sm", 
                                                            sColor.bg, sColor.text,
                                                            !isAssignedToMe ? "opacity-60 grayscale-[0.2] cursor-not-allowed" : "cursor-pointer"
                                                        )}
                                                    >
                                                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sColor.dot)} />
                                                        {!isAssignedToMe && <Lock className="h-2 w-2 mr-0.5 opacity-50 shrink-0" />}
                                                        <span className="truncate">{task.title}</span>
                                                    </div>
                                                ); 
                                            })}
                                            {dayTasks.length > 3 && <p className="text-[9px] font-bold text-[#2568C1] pl-1 mt-0.5 hover:underline cursor-pointer">+{dayTasks.length - 3} more</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========== DAY / WEEK VIEW ========== */}
                {(calView === "day" || calView === "week") && (() => {
                    const viewDays = calView === "week" ? weekDays : [currentMonth];
                    return (
                        <div className="flex min-w-[800px]" style={{ height: `${HOURS.length * HOUR_HEIGHT + HEADER_HEIGHT + EXTRA_PADDING}px` }}>
                            {/* Time gutter */}
                            <div className="w-[60px] flex-none border-r border-slate-200 bg-slate-50/30 sticky left-0 z-20">
                                <div
                                    style={{ height: `${HEADER_HEIGHT}px` }}
                                    className={cn("border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm", calView === "week" && "sticky top-0 z-40")}
                                />
                                <div style={{ height: `${EXTRA_PADDING}px` }} />
                                {HOURS.map(h => (
                                    <div key={h} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                                        <span className="text-[10px] font-bold text-slate-400 absolute -top-[7px] right-2 left-1 text-right">
                                            {format(new Date(new Date().setHours(h, 0, 0, 0)), "HH:mm")}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Day columns */}
                            <div className="flex-1 flex divide-x divide-slate-100">
                                {viewDays.map((day, dIdx) => {
                                    const dayTasks = getTasksForDay(day);
                                    return (
                                        <div key={dIdx} className="flex-1 relative min-w-0">
                                            {calView === "week" && (
                                                <div
                                                    className="flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-200"
                                                    style={{ height: `${HEADER_HEIGHT}px` }}
                                                >
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(day, "EEE")}</span>
                                                    <span className={cn("text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#2568C1] text-white shadow-md shadow-blue-200" : "text-slate-700")}>{format(day, "d")}</span>
                                                </div>
                                            )}

                                            <div style={{ height: `${EXTRA_PADDING}px` }} />

                                            {HOURS.map(h => (
                                                <div key={h} className="border-b border-slate-50" style={{ height: `${HOUR_HEIGHT}px` }}>
                                                    <div className="h-1/2 border-b border-slate-50/50" />
                                                </div>
                                            ))}

                                            {dayTasks.map(task => {
                                                const sColor = getStatusColor(task.status);
                                                const style = getTaskStyle(task, dayTasks);
                                                const isAssignedToMe = currentUser && String(task.assigned_to_id) === String(currentUser.id);
                                                
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                                        className={cn(
                                                            "absolute p-2 rounded-[4px] border-l-[3px] shadow-sm z-10 transition-all hover:z-20 hover:shadow-md group/task overflow-hidden",
                                                            sColor.bg, sColor.text, sColor.borderL,
                                                            !isAssignedToMe ? "opacity-60 grayscale-[0.2] cursor-not-allowed" : "cursor-pointer"
                                                        )}
                                                        style={{
                                                            top: `calc(${style.top} + ${HEADER_HEIGHT + EXTRA_PADDING}px)`,
                                                            minHeight: "44px",
                                                            ...(style.width
                                                                ? { width: style.width, left: style.left, right: style.right }
                                                                : { left: '2px', right: '2px' })
                                                        }}
                                                    >
                                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                                            <div className="flex items-center gap-1 min-w-0">
                                                                {!isAssignedToMe && <Lock className="h-2 w-2 opacity-50 shrink-0" />}
                                                                <span className={cn("text-[10px] font-bold leading-tight truncate", isAssignedToMe && "group-hover/task:text-[#2568C1]")}>{task.title}</span>
                                                            </div>
                                                            <span className="text-[8px] font-bold opacity-60 truncate">{format(new Date(task.created_at), "HH:mm")}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {isToday(day) && (
                                                <div
                                                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                                    style={{ top: `${(getHours(currentTime) * 60 + getMinutes(currentTime)) * (HOUR_HEIGHT / 60) + HEADER_HEIGHT + EXTRA_PADDING}px` }}
                                                >
                                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-[5px] ring-2 ring-red-500/20" />
                                                    <div className="flex-1 h-[2px] bg-red-500" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

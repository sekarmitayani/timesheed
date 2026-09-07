import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameMonth, isToday, getHours, getMinutes, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiTask } from "@/lib/services/task-service";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TaskCalendarViewProps {
    calView: "day" | "week" | "month";
    setCalView: (val: "day" | "week" | "month") => void;
    currentMonth: Date;
    setCurrentMonth: (val: Date) => void;
    navigateCalendar: (dir: "prev" | "next") => void;
    calendarDays: Date[];
    weekDays: Date[];
    getTasksForDay: (day: Date) => ApiTask[];
    handleDayClick: (day: Date) => void;
    handleTaskClick: (task: ApiTask) => void;
    getProjectColor: (pid: number) => any;
    getProjectName: (pid: number) => string;
    currentTime: Date;
    calendarScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function TaskCalendarView({
    calView,
    setCalView,
    currentMonth,
    setCurrentMonth,
    navigateCalendar,
    calendarDays,
    weekDays,
    getTasksForDay,
    handleDayClick,
    handleTaskClick,
    getProjectColor,
    getProjectName,
    currentTime,
    calendarScrollRef
}: TaskCalendarViewProps) {
    const getTaskStyle = (task: ApiTask, dayTasks: ApiTask[]) => {
        const date = new Date(task.created_at);
        const h = getHours(date);
        const m = getMinutes(date);
        const top = (h * 60 + m) * (64 / 60);
        const sameHourTasks = dayTasks.filter(t => getHours(new Date(t.created_at)) === h);
        const overlapIndex = sameHourTasks.findIndex(t => t.id === task.id);
        const overlapCount = sameHourTasks.length;
        if (overlapCount > 1) {
            const widthPercent = 100 / overlapCount;
            return { top: `${top}px`, width: `calc(${widthPercent}% - 4px)`, left: `calc(${overlapIndex * widthPercent}% + 2px)`, right: 'auto' };
        }
        return { top: `${top}px` };
    };

    return (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col shadow-sm flex-1 min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {calView === "day" 
                        ? format(currentMonth, "EEEE, dd MMMM yyyy") 
                        : calView === "week" 
                            ? `${format(startOfWeek(currentMonth), "dd MMM")} – ${format(endOfWeek(currentMonth), "dd MMM yyyy")}` 
                            : format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md" onClick={() => navigateCalendar("prev")}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 px-4 text-[10px] font-bold uppercase text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md tracking-widest" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#4B7BEC] hover:bg-white rounded-md" onClick={() => navigateCalendar("next")}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-0.5 rounded-md flex shrink-0">
                        {(["day", "week", "month"] as const).map(v => (
                            <Button key={v} variant="ghost" size="sm" className={cn("h-7 px-4 text-[10px] font-bold uppercase transition-all rounded-md tracking-widest", calView === v ? "bg-white text-[#4B7BEC] shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600 border border-transparent")} onClick={() => setCalView(v)}>{v}</Button>
                        ))}
                    </div>
                </div>
            </div>
            <div ref={calendarScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0 custom-scrollbar">
                {calView === "month" && (
                    <div className="flex flex-col">
                        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <div key={day} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 divide-x divide-slate-100 border-l border-slate-100">
                            {calendarDays.map((day, idx) => {
                                const dayTasks = getTasksForDay(day);
                                return (
                                    <div key={idx} className={cn("min-h-[75px] sm:min-h-[85px] lg:min-h-[110px] p-1 sm:p-1.5 bg-white transition-colors cursor-pointer border-b border-slate-100", !isSameMonth(day, currentMonth) ? "bg-slate-50/40" : "hover:bg-blue-50/20")} onClick={() => handleDayClick(day)}>
                                        <div className="flex items-center justify-center mb-1">
                                            <span className={cn("text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" : isSameMonth(day, currentMonth) ? "text-slate-700" : "text-slate-300")}>{format(day, "d")}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {dayTasks.slice(0, 3).map(task => { 
                                                const pColor = getProjectColor(task.project_id); 
                                                return (
                                                    <div key={task.id} onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }} className={cn("flex items-center gap-1 px-1.5 py-1 rounded-[4px] text-[9px] font-bold truncate transition-all hover:shadow-sm", pColor.bg, pColor.text)}>
                                                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", pColor.dot)} />
                                                        <span>{task.title}</span>
                                                    </div>
                                                ); 
                                            })}
                                            {dayTasks.length > 3 && <p className="text-[9px] font-bold text-[#4B7BEC] pl-1 mt-0.5 hover:underline cursor-pointer">+{dayTasks.length - 3} more</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {(calView === "day" || calView === "week") && (() => {
                    const viewDays = calView === "week" ? weekDays : [currentMonth];
                    const HOUR_HEIGHT = 64;
                    const HEADER_HEIGHT = calView === "week" ? 52 : 0;
                    const EXTRA_PADDING = 20;
                    return (
                        <div className="flex" style={{ height: `${HOURS.length * HOUR_HEIGHT + HEADER_HEIGHT + EXTRA_PADDING}px` }}>
                            <div className="w-[60px] flex-none border-r border-slate-200 bg-slate-50/30 sticky left-0 z-20">
                                <div style={{ height: `${HEADER_HEIGHT}px` }} className={cn("border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm", calView === "week" && "sticky top-0 z-40")} />
                                <div style={{ height: `${EXTRA_PADDING}px` }} />
                                {HOURS.map(h => (
                                    <div key={h} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                                        <span className="text-[10px] font-bold text-slate-400 absolute -top-[7px] right-2 left-1 text-right">{format(new Date(new Date().setHours(h, 0, 0, 0)), "HH:mm")}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 flex divide-x divide-slate-100">
                                {viewDays.map((day, dIdx) => {
                                    const dayTasks = getTasksForDay(day);
                                    return (
                                        <div key={dIdx} className="flex-1 relative min-w-0">
                                            {calView === "week" && (
                                                <div className="flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-200" style={{ height: `${HEADER_HEIGHT}px` }}>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(day, "EEE")}</span>
                                                    <span className={cn("text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-[#4B7BEC] text-white shadow-md shadow-blue-200" : "text-slate-700")}>{format(day, "d")}</span>
                                                </div>
                                            )}
                                            <div style={{ height: `${EXTRA_PADDING}px` }} />
                                            {HOURS.map(h => (
                                                <div key={h} className="border-b border-slate-50" style={{ height: `${HOUR_HEIGHT}px` }}>
                                                    <div className="h-1/2 border-b border-slate-50/50" />
                                                </div>
                                            ))}
                                            {dayTasks.map(task => {
                                                const pColor = getProjectColor(task.project_id);
                                                const style = getTaskStyle(task, dayTasks);
                                                return (
                                                    <div key={task.id} onClick={() => handleTaskClick(task)} className={cn("absolute p-2 rounded-[4px] border-l-[3px] shadow-sm cursor-pointer z-10 transition-all hover:z-20 hover:shadow-md group/task overflow-hidden", pColor.bg, pColor.text, pColor.borderL)} style={{ top: `calc(${style.top} + ${HEADER_HEIGHT + EXTRA_PADDING}px)`, minHeight: "44px", ...(style.width ? { width: style.width, left: style.left, right: style.right } : { left: '2px', right: '2px' }) }}>
                                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                                            <span className="text-[10px] font-bold leading-tight truncate group-hover/task:text-[#4B7BEC]">{task.title}</span>
                                                            <span className="text-[8px] font-bold opacity-60 truncate">{format(new Date(task.created_at), "HH:mm")} · {getProjectName(task.project_id)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isToday(day) && (
                                                <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: `${(getHours(currentTime) * 60 + getMinutes(currentTime)) * (HOUR_HEIGHT / 60) + HEADER_HEIGHT + EXTRA_PADDING}px` }}>
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

"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Clock, 
    LogIn, 
    LogOut, 
    Target 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameWeek } from "date-fns";
import { TimesheetLog } from "@/lib/services/timesheet-service";

interface QuickStatsRowProps {
    timesheets: TimesheetLog[];
}

export function QuickStatsRow({ timesheets }: QuickStatsRowProps) {
    
    const formatDuration = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = Math.round(totalMinutes % 60);
        return `${h}h ${m}m`;
    };

    const stats = useMemo(() => {
        const now = new Date();
        
        const weeklyLogs = timesheets.filter(log => 
            log.clock_in && isSameWeek(new Date(log.clock_in), now, { weekStartsOn: 1 })
        );

        // Avg Hours
        const totalMinutes = timesheets.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        const uniqueDays = new Set(timesheets.map(t => t.clock_in ? format(new Date(t.clock_in), "yyyy-MM-dd") : null).filter(Boolean)).size;
        const avgMinutesPerDay = uniqueDays > 0 ? totalMinutes / uniqueDays : 0;

        // Avg Clock In/Out
        const getMinutesFromDate = (dateStr: string | null) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return date.getHours() * 60 + date.getMinutes();
        };

        const formatMinutesToTime = (totalMinutes: number) => {
            const h = Math.floor(totalMinutes / 60);
            const m = Math.round(totalMinutes % 60);
            const date = new Date();
            date.setHours(h, m, 0);
            // Changed to 24h format as requested
            return format(date, "HH:mm");
        };

        const validClockIn = timesheets.map(a => getMinutesFromDate(a.clock_in)).filter((v): v is number => v !== null);
        const avgClockIn = validClockIn.length > 0 
            ? formatMinutesToTime(validClockIn.reduce((a, b) => a + b, 0) / validClockIn.length)
            : "--:--";

        const validClockOut = timesheets.map(a => getMinutesFromDate(a.clock_out)).filter((v): v is number => v !== null);
        const avgClockOut = validClockOut.length > 0 
            ? formatMinutesToTime(validClockOut.reduce((a, b) => a + b, 0) / validClockOut.length)
            : "--:--";

        // Weekly Progress
        const totalWeekMinutes = weeklyLogs.reduce((acc, curr) => acc + curr.duration_minutes, 0);

        return {
            avgHours: formatDuration(avgMinutesPerDay),
            avgClockIn,
            avgClockOut,
            weeklyTotal: formatDuration(totalWeekMinutes)
        };
    }, [timesheets]);

    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl h-[78px] flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-default p-0 py-0 gap-0";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Avg Hours */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#4B7BEC] shrink-0">
                        <Clock className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Avg / Day</p>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                            {stats.avgHours}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Avg Clock In */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <LogIn className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Avg Clock In</p>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                            {stats.avgClockIn}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Avg Clock Out */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <LogOut className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Avg Clock Out</p>
                        <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                            {stats.avgClockOut}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Weekly Total */}
            <Card className={cardClass}>
                <CardContent className="px-3.5 sm:px-4 py-2.5 flex flex-row items-center gap-3 sm:gap-3.5 h-full">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                        <Target className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Weekly Total</p>
                        <div className="text-xl sm:text-2xl font-black text-[#4B7BEC] tracking-tight leading-none truncate">
                            {stats.weeklyTotal}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

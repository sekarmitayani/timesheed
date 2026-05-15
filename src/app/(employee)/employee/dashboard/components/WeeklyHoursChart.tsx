"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { TimesheetLog } from "@/lib/services/timesheet-service";
import { cn } from "@/lib/utils";

interface WeeklyHoursChartProps {
    timesheets: TimesheetLog[];
    className?: string;
}

export function WeeklyHoursChart({ timesheets, className }: WeeklyHoursChartProps) {
    
    const chartData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
        
        return days.map(day => {
            const dayLogs = timesheets.filter(log => 
                log.clock_in && isSameDay(new Date(log.clock_in), day)
            );
            
            const totalMinutes = dayLogs.reduce((acc, curr) => acc + curr.duration_minutes, 0);
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
            
            return {
                day: format(day, "EEE"),
                date: format(day, "MMM d"),
                hours: totalHours
            };
        });
    }, [timesheets]);

    return (
        <Card className={cn("bg-white border-slate-100 shadow-sm flex flex-col", className)}>
            <CardHeader className="pb-2 border-b border-slate-50 flex flex-col items-start justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#4B7BEC]" /> Weekly Hours (Last 7 Days)
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium ml-6 mt-0.5">Daily breakdown of your logged work hours</p>
                </div>
            </CardHeader>
            <CardContent className="flex-1 px-5 pb-5 pt-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 11, fill: "#94a3b8" }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis 
                            tick={{ fontSize: 11, fill: "#94a3b8" }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{ 
                                background: "#fff", 
                                border: "1px solid #e2e8f0", 
                                borderRadius: 8, 
                                fontSize: 12, 
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                            }} 
                        />
                        <ReferenceLine 
                            y={8} 
                            stroke="#94a3b8" 
                            strokeDasharray="3 3" 
                            label={{ value: "Goal", position: "right", fill: "#94a3b8", fontSize: 10 }} 
                        />
                        <Bar 
                            dataKey="hours" 
                            fill="#4B7BEC" 
                            radius={[4, 4, 0, 0]} 
                            barSize={32} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
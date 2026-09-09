import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DaySummary {
    date: Date;
    label: string;
    dateDisplay: string;
    minutes: number;
    hours: string;
    isToday: boolean;
}

interface WeeklySummaryProps {
    dailySummary: DaySummary[];
}

export function WeeklySummary({ dailySummary }: WeeklySummaryProps) {
    const maxMins = Math.max(...dailySummary.map(d => d.minutes), 480);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 shrink-0">
            {dailySummary.map((day, idx) => {
                const barHeight = Math.max(15, (day.minutes / maxMins) * 100);
                
                return (
                    <Card key={idx} className={cn(
                        "border-[#E2E8F0] shadow-none rounded-[6px] overflow-hidden transition-all hover:border-[#4B7BEC]/30",
                        day.isToday && "ring-1 ring-[#4B7BEC]/20 border-[#4B7BEC]/20"
                    )}>
                        <CardContent className="p-2 space-y-2">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{day.label}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{day.dateDisplay}</span>
                                </div>
                                <span className={cn("text-xs font-bold", day.isToday ? "text-[#4B7BEC]" : "text-[#0f172a]")}>
                                    {day.hours}h
                                </span>
                            </div>
                            <div className="h-6 flex items-end gap-0.5 bg-slate-50/50 rounded-[2px] p-0.5">
                                <div 
                                    className={cn(
                                        "w-full rounded-[1px] transition-all duration-500",
                                        day.minutes >= 480 ? "bg-[#4B7BEC]" : "bg-[#4B7BEC]/30"
                                    )} 
                                    style={{ height: `${barHeight}%` }} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

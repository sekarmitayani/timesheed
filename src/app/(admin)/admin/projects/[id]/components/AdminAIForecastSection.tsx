"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface AdminAIForecastSectionProps {
    projectId: string;
    className?: string;
    compact?: boolean;
}

export function AdminAIForecastSection({ projectId, className, compact }: AdminAIForecastSectionProps) {
    const { data: forecast, isLoading, error } = useQuery({
        queryKey: ['admin', 'project', projectId, 'forecast'],
        queryFn: () => projectService.getProjectForecast(projectId),
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    if (isLoading) {
        return (
            <Card className={cn("bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0", className)}>
                <CardContent className="p-4 sm:p-5 flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#4B7BEC]" />
                    <span className="text-xs font-medium">Analyzing historical spend patterns & generating forecast...</span>
                </CardContent>
            </Card>
        );
    }

    if (error || !forecast) {
        return (
            <Card className={cn("bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0", className)}>
                <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <TrendingUp className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                        <div className="flex flex-col">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                AI Budget Forecast
                            </CardTitle>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                                Predictive analytics powered by Facebook Prophet
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 sm:p-5 text-center text-xs text-slate-400 font-medium">
                        Could not generate forecast: insufficient timesheet or budget data.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isSafe = forecast.status === "SAFE";
    const isCritical = forecast.status === "CRITICAL_OVER";

    return (
        <Card className={cn("bg-white border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 py-0 gap-0", className)}>
            <CardHeader className="px-5 py-5 border-b border-slate-100 [&.border-b]:pb-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <TrendingUp className="h-5 w-5 text-[#4B7BEC] shrink-0" />
                    <div className="flex flex-col">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            AI Budget Forecast
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                            Predictive analytics powered by Facebook Prophet
                        </p>
                    </div>
                </div>
                {isSafe ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Safe</span>
                    </div>
                ) : isCritical ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Critical Overbudget</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Warning</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3.5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Budget Spent</span>
                            <p className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">{formatCurrency(forecast.spent)}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Spent Percentage</span>
                            <p className={cn("text-sm sm:text-base font-bold tracking-tight", forecast.pct > 90 ? "text-red-600" : "text-slate-800")}>
                                {forecast.pct.toFixed(1)}%
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Estimated 30-Day Cost</span>
                            <p className="text-sm sm:text-base font-bold text-[#4B7BEC] tracking-tight">{formatCurrency(forecast.forecast_30d)}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Estimated Runway</span>
                            <p className={cn("text-sm sm:text-base font-bold tracking-tight", isCritical ? "text-red-600" : isSafe ? "text-emerald-600" : "text-slate-800")}>
                                {isCritical ? "Budget Depleted" : (forecast.runway ? formatDate(forecast.runway) : "> 90 Days (Safe)")}
                            </p>
                        </div>
                    </div>

                    {forecast.explanation && (
                        <div className="bg-slate-50/70 rounded-lg px-3.5 py-2.5 border border-slate-100 border-l-[3px] border-l-[#4B7BEC] text-xs text-slate-600 font-medium">
                            &quot;{forecast.explanation}&quot;
                        </div>
                    )}
                </div>

                {!compact && (
                    <div className="px-5 py-2.5 mt-auto border-t border-slate-100 bg-slate-50/30 flex items-start sm:items-center gap-2 text-slate-400 shrink-0">
                        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            <span className="font-semibold text-slate-600">About this data:</span> This forecast is generated by analyzing historical spending patterns (timesheets & approved resources) using Facebook Prophet. The &quot;Runway&quot; indicates the estimated date when cumulative costs will exceed the budget threshold.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

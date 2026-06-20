"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/lib/services/project-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminAIForecastSectionProps {
    projectId: string;
}

export function AdminAIForecastSection({ projectId }: AdminAIForecastSectionProps) {
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
            <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden mt-6">
                <CardContent className="flex flex-col items-center justify-center p-8 gap-4 min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2568C1]" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Running AI Prophet Forecast...</p>
                </CardContent>
            </Card>
        );
    }

    if (error || !forecast) {
        return (
            <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden mt-6 bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center p-8 gap-2 min-h-[200px]">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="text-sm font-bold text-slate-600">AI Forecast Unavailable</p>
                    <p className="text-xs text-slate-500 text-center max-w-md">
                        Not enough historical data to generate a reliable forecast, or the AI engine is currently offline.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const isSafe = forecast.status === "SAFE";
    const isCritical = forecast.status === "CRITICAL_OVER";

    return (
        <Card className="border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden mt-6">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#2568C1]" />
                            AI Budget Forecast
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 font-medium mt-1">
                            Predictive analytics powered by Facebook Prophet
                        </CardDescription>
                    </div>
                    {isSafe ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Safe</span>
                        </div>
                    ) : isCritical ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Overbudget</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Warning</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Spent</span>
                        <p className="text-sm font-bold text-slate-800">{formatCurrency(forecast.spent)}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spent Percentage</span>
                        <p className={cn("text-sm font-bold", forecast.pct > 90 ? "text-red-600" : "text-slate-800")}>
                            {forecast.pct.toFixed(1)}%
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated 30-Day Cost</span>
                        <p className="text-sm font-bold text-[#2568C1]">{formatCurrency(forecast.forecast_30d)}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Runway</span>
                        <p className={cn("text-sm font-bold", !forecast.runway ? "text-red-600" : "text-slate-800")}>
                            {forecast.runway ? forecast.runway : "Budget Depleted"}
                        </p>
                    </div>
                </div>

                {forecast.explanation && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-sm text-slate-600 italic">
                        &quot;{forecast.explanation}&quot;
                    </div>
                )}

                <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                    <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">About this data</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            This forecast is generated by analyzing historical spending patterns, including employee timesheets and approved resource requests. The machine learning model uses a time-series forecasting algorithm to predict future costs over the next 90 days. The "Runway" indicates the estimated date when the project's cumulative costs will exceed the defined budget threshold.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

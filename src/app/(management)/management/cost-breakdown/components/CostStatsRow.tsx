import { Card, CardContent } from "@/components/ui/card";
import { CostBreakdownSummaryResponse } from "@/lib/services/management-service";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Building2, Wallet, Users, Box, Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CostStatsRowProps {
    data?: CostBreakdownSummaryResponse;
    isLoading: boolean;
}

const fmtCurrencyShort = (v: number): string => {
    const abs = Math.abs(v);
    if (abs >= 1000000000) return `Rp ${(v / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `Rp ${(v / 1000).toFixed(1)}K`;
    return `Rp ${v.toLocaleString("id-ID")}`;
};

const fmtChange = (v: number): string => {
    const abs = Math.abs(v);
    if (abs >= 100) return `${Math.round(abs)}%`;
    return `${abs.toFixed(1)}%`;
};

interface TrendProps {
    change: number;
    invertColor?: boolean;
}

function TrendBadge({ change, invertColor = false }: TrendProps) {
    if (change === 0) {
        return (
            <div className="flex items-center gap-0.5 text-slate-400">
                <Minus className="h-3 w-3" />
                <span className="text-[10px] font-bold">0%</span>
            </div>
        );
    }

    const isUp = change > 0;
    const isPositive = invertColor ? !isUp : isUp;

    return (
        <div
            className={`flex items-center gap-0.5 ${
                isPositive ? "text-emerald-600" : "text-red-500"
            }`}
        >
            {isUp ? (
                <ArrowUpRight className="h-3 w-3" />
            ) : (
                <ArrowDownRight className="h-3 w-3" />
            )}
            <span className="text-[10px] font-bold">{fmtChange(change)}</span>
        </div>
    );
}

export function CostStatsRow({ data, isLoading }: CostStatsRowProps) {
    const cardClass = "bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow";

    if (isLoading || !data) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className={cardClass}>
                        <CardContent className="px-3 py-3 sm:px-4 sm:py-3 flex flex-row items-center gap-3 sm:gap-4 h-full">
                            <Skeleton className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-2 sm:h-3 w-16 sm:w-20 mb-2" />
                                <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const stats = [
        {
            label: "Total Expenses",
            value: data.total_expenses.value,
            change: data.total_expenses.trend,
            invertColor: true,
            icon: Building2,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
        },
        {
            label: "Salary & Comp",
            value: data.salary_comp.value,
            change: data.salary_comp.trend,
            invertColor: true,
            icon: Users,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-500",
        },
        {
            label: "Resource Requests",
            value: data.resource_requests.value,
            change: data.resource_requests.trend,
            invertColor: true,
            icon: Box,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
        },
        {
            label: "Pending Liability",
            value: data.pending_liability.value,
            change: data.pending_liability.trend,
            invertColor: true,
            icon: Landmark,
            iconBg: "bg-slate-50",
            iconColor: "text-slate-500",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat) => (
                <Card key={stat.label} className={cardClass}>
                    <CardContent className="px-3 py-3 sm:px-4 sm:py-3 flex flex-row items-center gap-3 sm:gap-4 h-full">
                        <div
                            className={`h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} shrink-0`}
                        >
                            <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                {stat.label}
                            </p>
                            <span className="text-base sm:text-lg lg:text-2xl font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {fmtCurrencyShort(stat.value)}
                            </span>
                            <div className="mt-0.5">
                                <TrendBadge
                                    change={stat.change}
                                    invertColor={stat.invertColor}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

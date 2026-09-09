"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Receipt, Landmark, ArrowUpRight, ArrowDownRight, Minus, Users, Clock } from "lucide-react";
import { KpiStats } from "../hooks/useManagementDashboardData";

interface KpiStatsRowProps {
    stats: KpiStats;
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
    invertColor?: boolean; // true for expenses: up = bad, down = good
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

const cardClass =
    "bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow";

export function KpiStatsRow({ stats }: KpiStatsRowProps) {
    const kpis = [
        {
            label: "Total Revenue",
            value: fmtCurrencyShort(stats.totalRevenue),
            change: stats.revenueChange,
            invertColor: false,
            icon: Wallet,
            iconBg: "bg-blue-50",
            iconColor: "text-[#4B7BEC]",
        },
        {
            label: "Net Margin",
            value: fmtCurrencyShort(stats.margin),
            change: stats.marginChange,
            invertColor: false,
            icon: stats.marginChange >= 0 ? TrendingUp : TrendingDown,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
        },
        {
            label: "Total Expenses",
            value: fmtCurrencyShort(stats.totalExpenses),
            change: stats.expensesChange,
            invertColor: true,
            icon: Receipt,
            iconBg: "bg-red-50",
            iconColor: "text-red-500",
        },
        {
            label: "Total Liability",
            value: fmtCurrencyShort(stats.totalLiability),
            change: undefined,
            invertColor: false,
            icon: Landmark,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
        },
        {
            label: "Salary & Comp",
            value: fmtCurrencyShort(stats.salaryComp),
            change: stats.salaryChange,
            invertColor: true,
            icon: Users,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
        },
        {
            label: "Pending Res",
            value: String(stats.pendingResources),
            change: undefined,
            invertColor: false,
            icon: Clock,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
            {kpis.map((kpi) => (
                <Card key={kpi.label} className={cardClass}>
                    <CardContent className="px-2.5 py-3 sm:px-3 sm:py-3 flex flex-row items-center gap-2.5 sm:gap-3 h-full">
                        <div
                            className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl ${kpi.iconBg} flex items-center justify-center ${kpi.iconColor} shrink-0`}
                        >
                            <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                {kpi.label}
                            </p>
                            <span className="text-sm sm:text-base lg:text-lg font-black text-slate-800 tracking-tight leading-tight block truncate">
                                {kpi.value}
                            </span>
                            {kpi.change !== undefined && (
                                <div className="mt-0.5">
                                    <TrendBadge
                                        change={kpi.change}
                                        invertColor={kpi.invertColor}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

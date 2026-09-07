import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function DashboardHeaderSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1">
            <div className="space-y-2">
                <Skeleton className="h-7 w-64 bg-slate-200/70" />
                <Skeleton className="h-4 w-80 bg-slate-200/50" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-32 rounded-md bg-slate-200/60" />
                <Skeleton className="h-9 w-28 rounded-md bg-slate-200/60" />
            </div>
        </div>
    );
}

export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white border border-slate-100 shadow-xs rounded-xl h-[100px] px-4 py-3 flex flex-row items-center gap-4"
                >
                    <Skeleton className="h-12 w-12 rounded-xl shrink-0 bg-slate-200/70" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20 bg-slate-200/50" />
                        <Skeleton className="h-6 w-24 bg-slate-200/70" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DashboardCardSkeleton({
    className = "",
    bodyHeight = "h-64",
}: {
    className?: string;
    bodyHeight?: string;
}) {
    return (
        <Card className={`bg-white border-slate-100 shadow-xs rounded-xl overflow-hidden flex flex-col p-0 gap-0 ${className}`}>
            <CardHeader className="px-5 py-5 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-5 w-5 rounded bg-slate-200/70" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32 bg-slate-200/70" />
                        <Skeleton className="h-2.5 w-44 bg-slate-200/50" />
                    </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-md bg-slate-200/50" />
            </CardHeader>
            <CardContent className={`p-5 flex flex-col justify-center ${bodyHeight}`}>
                <div className="space-y-3 w-full">
                    <Skeleton className="h-4 w-full bg-slate-200/50" />
                    <Skeleton className="h-4 w-4/5 bg-slate-200/50" />
                    <Skeleton className="h-4 w-3/5 bg-slate-200/50" />
                    <Skeleton className="h-24 w-full rounded-lg bg-slate-100/80 mt-4" />
                </div>
            </CardContent>
        </Card>
    );
}

export function ProjectCardsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-36 bg-slate-200/70" />
                            <Skeleton className="h-3 w-24 bg-slate-200/50" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full bg-slate-200/50" />
                    </div>
                    <Skeleton className="h-3.5 w-full bg-slate-200/50" />
                    <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-16 bg-slate-200/50" />
                            <Skeleton className="h-3 w-10 bg-slate-200/50" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full bg-slate-100" />
                    </div>
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <Skeleton className="h-6 w-20 rounded-md bg-slate-200/50" />
                        <Skeleton className="h-6 w-6 rounded-full bg-slate-200/70" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProjectDetailSkeleton() {
    return (
        <div className="flex flex-col w-full gap-6 h-full overflow-hidden animate-in fade-in duration-300">
            {/* Top Navigation & Action Buttons */}
            <div className="shrink-0 flex items-center justify-between">
                <Skeleton className="h-8 w-36 rounded-md bg-slate-200/60" />
                <Skeleton className="h-9 w-28 rounded-md bg-slate-200/60" />
            </div>

            {/* Project Header Card */}
            <div className="border border-[#E2E8F0] bg-white pt-6 px-6 sm:px-8 rounded-xl shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <Skeleton className="h-16 w-16 rounded-full shrink-0 bg-slate-200/70" />
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-48 bg-slate-200/80" />
                            <Skeleton className="h-5 w-20 rounded-full bg-slate-200/50" />
                        </div>
                        <Skeleton className="h-3.5 w-72 bg-slate-200/50" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-200/60" />
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-200/60" />
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-200/60" />
                    </div>
                </div>

                {/* Tabs bar */}
                <div className="flex items-center gap-6 border-t border-slate-100 pt-3 pb-1">
                    <Skeleton className="h-4 w-20 bg-slate-200/70" />
                    <Skeleton className="h-4 w-16 bg-slate-200/50" />
                    <Skeleton className="h-4 w-16 bg-slate-200/50" />
                    <Skeleton className="h-4 w-20 bg-slate-200/50" />
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <KpiCardsSkeleton count={4} />

            {/* Bottom Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                <DashboardCardSkeleton bodyHeight="h-56" />
                <DashboardCardSkeleton bodyHeight="h-56" />
            </div>
        </div>
    );
}


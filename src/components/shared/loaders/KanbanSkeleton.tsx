import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton({ columns = 3 }: { columns?: number }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
            {Array.from({ length: columns }).map((_, colIdx) => (
                <div key={colIdx} className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3">
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded-full bg-slate-200/70" />
                            <Skeleton className="h-4 w-24 bg-slate-200/70" />
                        </div>
                        <Skeleton className="h-5 w-6 rounded-full bg-slate-200/50" />
                    </div>

                    {/* Card Skeletons */}
                    {Array.from({ length: 3 }).map((__, cardIdx) => (
                        <div
                            key={cardIdx}
                            className="bg-white border border-slate-100 rounded-lg p-3.5 shadow-2xs space-y-2.5"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-16 rounded bg-slate-200/50" />
                                <Skeleton className="h-4 w-12 rounded-full bg-slate-200/50" />
                            </div>
                            <Skeleton className="h-4 w-full bg-slate-200/70" />
                            <Skeleton className="h-3 w-4/5 bg-slate-200/50" />
                            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                <Skeleton className="h-5 w-16 rounded-full bg-slate-200/50" />
                                <Skeleton className="h-6 w-6 rounded-full bg-slate-200/70" />
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

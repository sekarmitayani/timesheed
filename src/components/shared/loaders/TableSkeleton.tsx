import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

interface TableSkeletonProps {
    columns: number;
    rows?: number;
    hasAvatar?: boolean;
    hasActions?: boolean;
    avatarColIndex?: number;
    actionsColIndex?: number;
}

export function TableSkeleton({
    columns,
    rows = 5,
    hasAvatar = false,
    hasActions = false,
    avatarColIndex = 1,
    actionsColIndex = columns - 1,
}: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b border-slate-100 last:border-0 hover:bg-transparent">
                    {Array.from({ length: columns }).map((__, colIndex) => {
                        // First column: Row number / ID
                        if (colIndex === 0) {
                            return (
                                <TableCell key={colIndex} className="pl-6 py-3.5">
                                    <Skeleton className="h-4 w-6 rounded bg-slate-200/70" />
                                </TableCell>
                            );
                        }

                        // Avatar column: Profile picture + Name & Email
                        if (hasAvatar && colIndex === avatarColIndex) {
                            return (
                                <TableCell key={colIndex} className="py-3.5">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-9 w-9 rounded-full shrink-0 bg-slate-200/70" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-3.5 w-28 bg-slate-200/70" />
                                            <Skeleton className="h-2.5 w-36 bg-slate-200/50" />
                                        </div>
                                    </div>
                                </TableCell>
                            );
                        }

                        // Actions column: Small button placeholders
                        if (hasActions && colIndex === actionsColIndex) {
                            return (
                                <TableCell key={colIndex} className="pr-6 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Skeleton className="h-7 w-7 rounded-full bg-slate-200/70" />
                                        <Skeleton className="h-7 w-7 rounded-full bg-slate-200/70" />
                                    </div>
                                </TableCell>
                            );
                        }

                        // Default content column: Varies in width slightly for natural look
                        const widths = ["w-20", "w-24", "w-28", "w-32", "w-16"];
                        const widthClass = widths[(rowIndex + colIndex) % widths.length];

                        return (
                            <TableCell key={colIndex} className="py-3.5">
                                <Skeleton className={`h-3.5 ${widthClass} bg-slate-200/60`} />
                            </TableCell>
                        );
                    })}
                </TableRow>
            ))}
        </>
    );
}

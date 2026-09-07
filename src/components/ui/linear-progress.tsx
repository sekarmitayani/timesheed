import React from "react";
import { cn } from "@/lib/utils";

interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number; // 0 - 100 for determinate, undefined for indeterminate
    indeterminate?: boolean;
    height?: string;
    color?: string; // Optional custom color class
}

export function LinearProgress({
    value,
    indeterminate,
    height = "h-1.5",
    color = "bg-[#4B7BEC]",
    className,
    ...props
}: LinearProgressProps) {
    const isDeterminate = !indeterminate && typeof value === "number";

    return (
        <div
            role="progressbar"
            aria-valuenow={isDeterminate ? Math.round(value!) : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn(
                "relative w-full overflow-hidden rounded-full bg-slate-100",
                height,
                className
            )}
            {...props}
        >
            {isDeterminate ? (
                <div
                    className={cn("h-full transition-all duration-300 ease-out", color)}
                    style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
                />
            ) : (
                <div
                    className={cn(
                        "h-full w-full origin-left-right animate-[indeterminate_1.5s_infinite_linear]",
                        color
                    )}
                    style={{
                        backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                        backgroundSize: "200% 100%",
                    }}
                />
            )}
        </div>
    );
}

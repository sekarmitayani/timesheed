"use client";

export function ProfitabilityHeader() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Profitability Analysis
                </h1>
                <p className="text-sm font-medium text-slate-500">
                    Monthly growth and project profitability tracking.
                </p>
            </div>
        </div>
    );
}

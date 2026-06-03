"use client";

export function ProfitabilityHeader() {
    return (
        <div className="sticky top-0 z-20 bg-[#F8FAFC]/90 backdrop-blur-md -mx-6 px-6 -mt-2 pb-2 mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-transparent transition-all">
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

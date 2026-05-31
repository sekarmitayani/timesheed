"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useProfitabilityData } from "./hooks/useProfitabilityData";
import { ProfitabilityHeader } from "./components/ProfitabilityHeader";
import { MonthlyProfitChart } from "./components/MonthlyProfitChart";
import { ProjectProfitabilityGrid } from "./components/ProjectProfitabilityGrid";

export default function ProfitabilityPage() {
    const [months, setMonths] = useState(6);
    const { isLoading, monthlyData, projectData } = useProfitabilityData(months);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ProfitabilityHeader />
            {isLoading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-[#4B7BEC] mx-auto" />
                        <p className="text-sm text-slate-500">Loading profitability data...</p>
                    </div>
                </div>
            ) : (
                <>
                    <MonthlyProfitChart data={monthlyData} months={months} setMonths={setMonths} />
                    <ProjectProfitabilityGrid projects={projectData} />
                </>
            )}
        </div>
    );
}

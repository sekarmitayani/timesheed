"use client";

import { useState } from "react";
import { DashboardCardSkeleton, ProjectCardsSkeleton } from "@/components/shared/loaders/DashboardSkeleton";
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
                <div className="space-y-6">
                    <DashboardCardSkeleton bodyHeight="h-72" />
                    <ProjectCardsSkeleton count={4} />
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

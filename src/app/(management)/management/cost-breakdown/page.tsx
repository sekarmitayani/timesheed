"use client";

import { useState } from "react";
import { CostBreakdownHeader } from "./components/CostBreakdownHeader";
import { CostStatsRow } from "./components/CostStatsRow";
import { CostDistributionChart } from "./components/CostDistributionChart";
import { MonthlyCostTrendChart } from "./components/MonthlyCostTrendChart";
import { ProjectCostSummaryList } from "./components/ProjectCostSummaryList";
import { CostLogsFilters } from "./components/CostLogsFilters";
import { CostLogsTable } from "./components/CostLogsTable";
import { 
    useCostBreakdownSummary, 
    useCostBreakdownProjects, 
    useCostBreakdownLogs 
} from "./hooks/useCostBreakdown";

export default function CostBreakdownPage() {
    // Header Filters
    const [daysFilter, setDaysFilter] = useState("180");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Table Filters
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Queries
    const { data: summaryData, isLoading: isLoadingSummary } = useCostBreakdownSummary(daysFilter, categoryFilter);
    const { data: projectsData, isLoading: isLoadingProjects } = useCostBreakdownProjects();
    const { data: logsData, isLoading: isLoadingLogs } = useCostBreakdownLogs(page, limit, search, categoryFilter);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <CostBreakdownHeader 
                daysFilter={daysFilter}
                setDaysFilter={setDaysFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
            />

            <CostStatsRow 
                data={summaryData} 
                isLoading={isLoadingSummary} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <CostDistributionChart 
                    data={summaryData?.distribution} 
                    isLoading={isLoadingSummary}
                    totalExpenses={summaryData?.total_expenses?.value || 0}
                />
                <MonthlyCostTrendChart 
                    data={summaryData?.monthly_trend} 
                    isLoading={isLoadingSummary} 
                />
            </div>

            <ProjectCostSummaryList 
                projects={projectsData?.items} 
                isLoading={isLoadingProjects} 
            />

            <div>
                <CostLogsFilters 
                    search={search}
                    setSearch={setSearch}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    limit={limit}
                    setLimit={setLimit}
                    setPage={setPage}
                />
                
                <CostLogsTable 
                    logs={logsData?.data || []} 
                    isLoading={isLoadingLogs} 
                    pagination={logsData?.pagination || { page, limit, total: 0 }}
                    setPage={setPage}
                />
            </div>
        </div>
    );
}

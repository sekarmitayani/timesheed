import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { 
    managementService, 
    FinancialHealthResponse, 
    LiabilityMonitorResponse, 
    WorkingHoursResponse, 
    CostBreakdownItem,
    MonthlyProfitItem,
    CostBreakdownSummaryResponse,
    ManagementResourceStats,
    ProjectProfitItem
} from "@/lib/services/management-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";

// ---- Exported Types ----

export interface KpiStats {
    totalRevenue: number;
    margin: number;
    totalExpenses: number;
    totalLiability: number;
    salaryComp: number;
    pendingResources: number;
    revenueChange: number;
    marginChange: number;
    expensesChange: number;
    salaryChange: number;
}

export interface PLSummaryItem {
    label: string;
    value: number;
    isNegative?: boolean;
    isBold?: boolean;
}

export interface FinancialHealthData {
    costBreakdown: CostBreakdownItem[];
    totalCost: number;
    plSummary: PLSummaryItem[];
}

export interface WorkingHoursData {
    totalHours: number;
    totalDays: number;
}

export interface ProjectEfficiencyItem {
    id: number;
    name: string;
    hours: number;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useManagementDashboardData() {
    // 1. Financial Health
    const { data: financialRaw, isLoading: isLoadingFinancial } = useQuery({
        queryKey: ["management", "financial"],
        queryFn: () => managementService.getFinancialHealth(),
        staleTime: STALE_TIME,
    });

    // 1b. Financial Comparison (MoM)
    const { data: comparisonRaw, isLoading: isLoadingComparison } = useQuery({
        queryKey: ["management", "financial", "comparison"],
        queryFn: () => managementService.getFinancialComparison(),
        staleTime: STALE_TIME,
    });

    // 2. Liability Monitor
    const { data: liabilityRaw, isLoading: isLoadingLiability } = useQuery({
        queryKey: ["management", "liability"],
        queryFn: () => managementService.getLiabilityMonitor(),
        staleTime: STALE_TIME,
    });

    // 3. Working Hours (overall)
    const { data: workingHoursRaw, isLoading: isLoadingWorkingHours } = useQuery({
        queryKey: ["management", "working-hours"],
        queryFn: () => managementService.getWorkingHoursReport(),
        staleTime: STALE_TIME,
    });

    // 4. Projects list (for per-project efficiency)
    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ["management", "projects", "list"],
        queryFn: () => projectService.getProjects(1, 200),
        staleTime: STALE_TIME,
    });

    const activeProjects = useMemo(() => {
        const projects = projectsData?.data || [];
        return projects.filter((p) => p.status === "active").slice(0, 5);
    }, [projectsData]);

    // 5. Per-project working hours (parallel queries for top active projects)
    const projectHoursQueries = useQueries({
        queries: activeProjects.map((project) => ({
            queryKey: ["management", "working-hours", "project", project.id],
            queryFn: () => managementService.getWorkingHoursReport(project.id),
            staleTime: STALE_TIME,
            enabled: activeProjects.length > 0,
        })),
    });

    const isLoadingProjectHours = projectHoursQueries.some((q) => q.isLoading);

    // 6. Profitability Snapshot (3 months)
    const { data: monthlyProfitRaw, isLoading: isLoadingMonthlyProfit } = useQuery({
        queryKey: ["management", "profitability", "monthly", 3],
        queryFn: () => managementService.getMonthlyProfit(3),
        staleTime: STALE_TIME,
    });

    // 7. Cost Breakdown Mini
    const { data: costBreakdownSummaryRaw, isLoading: isLoadingCostBreakdownSummary } = useQuery({
        queryKey: ["management", "costBreakdownSummary", "30", "all"],
        queryFn: () => managementService.getCostBreakdownSummary("30", "all"),
        staleTime: STALE_TIME,
    });

    // 8. Resources Overview
    const { data: resourcesStatsRaw, isLoading: isLoadingResourcesStats } = useQuery({
        queryKey: ["management", "resources", "stats"],
        queryFn: () => managementService.getManagementResourceStats(),
        staleTime: STALE_TIME,
    });

    // 9. Top Projects
    const { data: projectProfitabilityRaw, isLoading: isLoadingProjectProfitability } = useQuery({
        queryKey: ["management", "profitability", "projects"],
        queryFn: () => managementService.getProjectProfitability(),
        staleTime: STALE_TIME,
    });

    const isLoading = 
        isLoadingFinancial || 
        isLoadingComparison || 
        isLoadingLiability || 
        isLoadingWorkingHours || 
        isLoadingProjects || 
        isLoadingProjectHours ||
        isLoadingMonthlyProfit ||
        isLoadingCostBreakdownSummary ||
        isLoadingResourcesStats ||
        isLoadingProjectProfitability;

    // ---- Derived Data ----

    const kpiStats = useMemo((): KpiStats => {
        const totalRevenue = financialRaw?.total_revenue ?? 0;
        const totalExpenses = (financialRaw?.total_expenses ?? 0) + (financialRaw?.total_cost_sdm ?? 0);
        const margin = financialRaw?.margin ?? 0;
        const totalLiability = liabilityRaw?.total_liability ?? 0;
        const salaryComp = costBreakdownSummaryRaw?.salary_comp?.value ?? 0;
        const pendingResources = resourcesStatsRaw?.total_pending ?? 0;

        const revenueChange = comparisonRaw?.changes?.revenue_change ?? 0;
        const marginChange = comparisonRaw?.changes?.margin_change ?? 0;
        const expensesChange = comparisonRaw?.changes?.expenses_change ?? 0;
        const salaryChange = costBreakdownSummaryRaw?.salary_comp?.trend ?? 0;

        return { 
            totalRevenue, 
            margin, 
            totalExpenses, 
            totalLiability, 
            salaryComp,
            pendingResources,
            revenueChange, 
            marginChange, 
            expensesChange,
            salaryChange 
        };
    }, [financialRaw, liabilityRaw, comparisonRaw, costBreakdownSummaryRaw, resourcesStatsRaw]);

    const financialHealth = useMemo((): FinancialHealthData => {
        const costBreakdown = financialRaw?.cost_breakdown ?? [];
        const totalCost = costBreakdown.reduce((sum, item) => sum + item.value, 0);

        const grossRevenue = financialRaw?.total_revenue ?? 0;
        const totalCOGS = financialRaw?.total_cost_sdm ?? 0;
        const grossProfit = grossRevenue - totalCOGS;
        const operatingExpenses = financialRaw?.total_expenses ?? 0;
        const netMargin = grossProfit - operatingExpenses;

        const plSummary: PLSummaryItem[] = [
            { label: "Gross Revenue", value: grossRevenue },
            { label: "Total COGS", value: totalCOGS, isNegative: true },
            { label: "Gross Profit", value: grossProfit },
            { label: "Operating Expenses", value: operatingExpenses, isNegative: true },
            { label: "Net Margin", value: netMargin, isBold: true },
        ];

        return { costBreakdown, totalCost, plSummary };
    }, [financialRaw]);

    const workingHours = useMemo((): WorkingHoursData => {
        return {
            totalHours: Math.round(workingHoursRaw?.total_hours ?? 0),
            totalDays: Math.round(workingHoursRaw?.total_days ?? 0),
        };
    }, [workingHoursRaw]);

    const projectEfficiency = useMemo((): ProjectEfficiencyItem[] => {
        return activeProjects
            .map((project, index) => {
                const queryResult = projectHoursQueries[index];
                const hours = Math.round(queryResult?.data?.total_hours ?? 0);
                return { id: project.id, name: project.name, hours };
            })
            .filter((p) => p.hours > 0)
            .sort((a, b) => b.hours - a.hours);
    }, [activeProjects, projectHoursQueries]);

    // Derived Enriched Data
    const profitabilitySnapshot = useMemo(() => {
        return monthlyProfitRaw?.items || [];
    }, [monthlyProfitRaw]);

    const costBreakdownMini = useMemo(() => {
        return costBreakdownSummaryRaw;
    }, [costBreakdownSummaryRaw]);

    const liabilitySnapshot = useMemo(() => {
        return liabilityRaw;
    }, [liabilityRaw]);

    const resourcesOverview = useMemo(() => {
        return resourcesStatsRaw;
    }, [resourcesStatsRaw]);

    const topProjects = useMemo(() => {
        return (projectProfitabilityRaw?.items || []).slice(0, 5); // top 5
    }, [projectProfitabilityRaw]);

    return {
        isLoading,
        kpiStats,
        financialHealth,
        workingHours,
        projectEfficiency,
        profitabilitySnapshot,
        costBreakdownMini,
        liabilitySnapshot,
        resourcesOverview,
        topProjects,
    };
}

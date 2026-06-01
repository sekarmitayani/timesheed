import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { managementService, MonthlyProfitItem, ProjectProfitItem } from "@/lib/services/management-service";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export interface MonthlyProfitChartData extends MonthlyProfitItem {}
export interface ProjectProfitCardData extends ProjectProfitItem {}

export function useProfitabilityData(months: number = 6) {
    const { data: monthlyRaw, isLoading: isLoadingMonthly } = useQuery({
        queryKey: ["management", "profitability", "monthly", months],
        queryFn: () => managementService.getMonthlyProfit(months),
        staleTime: STALE_TIME,
    });

    const { data: projectsRaw, isLoading: isLoadingProjects } = useQuery({
        queryKey: ["management", "profitability", "projects"],
        queryFn: () => managementService.getProjectProfitability(),
        staleTime: STALE_TIME,
    });

    const isLoading = isLoadingMonthly || isLoadingProjects;

    const monthlyData = useMemo((): MonthlyProfitChartData[] => {
        return monthlyRaw?.items || [];
    }, [monthlyRaw]);

    const projectData = useMemo((): ProjectProfitCardData[] => {
        return projectsRaw?.items || [];
    }, [projectsRaw]);

    return {
        isLoading,
        monthlyData,
        projectData,
    };
}

import { useQuery } from "@tanstack/react-query";
import { managementService } from "@/lib/services/management-service";

export function useCostBreakdownSummary(days: number | string = 30, category: string = "all") {
    return useQuery({
        queryKey: ["costBreakdownSummary", days, category],
        queryFn: () => managementService.getCostBreakdownSummary(days, category),
        staleTime: 0,
    });
}

export function useCostBreakdownProjects() {
    return useQuery({
        queryKey: ["costBreakdownProjects"],
        queryFn: () => managementService.getCostBreakdownProjects(),
        staleTime: 0,
    });
}

export function useCostBreakdownLogs(page: number, limit: number, search: string, category: string, projectId?: string | number, startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ["costBreakdownLogs", page, limit, search, category, projectId, startDate, endDate],
        queryFn: () => managementService.getCostBreakdownLogs(page, limit, search, category, projectId, startDate, endDate),
        staleTime: 1 * 60 * 1000, // Logs might update more frequently
        placeholderData: (prev) => prev,
    });
}

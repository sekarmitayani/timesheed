import { useQuery } from "@tanstack/react-query";
import { managementService } from "@/lib/services/management-service";

export function useLiabilityMonitor() {
    return useQuery({
        queryKey: ["liability-monitor"],
        queryFn: () => managementService.getLiabilityMonitor(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useLiabilityContractDetail(contractId: number | null) {
    return useQuery({
        queryKey: ["liability-contract-detail", contractId],
        queryFn: () => {
            if (!contractId) return Promise.reject("No contract ID");
            return managementService.getLiabilityContractDetail(contractId);
        },
        enabled: !!contractId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

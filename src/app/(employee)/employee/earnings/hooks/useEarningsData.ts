import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { EnrichedContract } from "../types";

export function useEarningsData(userId: string | undefined) {
    const { data: response, isLoading } = useQuery({
        queryKey: ['employee', 'earnings', userId],
        queryFn: async () => {
            if (!userId) return null;
            return fetchApi("/my-earnings");
        },
        enabled: !!userId,
    });

    const data = response?.data || {};

    const enrichedContracts: EnrichedContract[] = (data.contracts || []).map((c: any) => ({
        ...c,
        // Ensure mapping if backend field names slightly differ from what UI expects
        total_earned: c.calculated_target || c.total_earned,
        payment_status: c.status || c.payment_status,
        total_liability: c.remaining || c.total_liability,
        payments: c.payments || [],
    }));

    const myPayments = (data.my_payments || []).map((p: any) => {
        const contract = enrichedContracts.find(c => c.id === p.contract_id);
        return {
            id: String(p.id),
            amount: p.amount,
            date: p.paid_at || p.createdAt,
            projectName: contract?.project_id ? contract.project_name : "-",
            contractType: contract?.project_id ? "Project" : "Base",
            description: p.description || ""
        };
    });

    return {
        enrichedContracts,
        isLoading,
        myPayments,
        totalEarned: data.total_earned || 0,
        currentMonthReleased: data.current_month_released || 0,
        totalLiability: data.total_liability || 0
    };
}

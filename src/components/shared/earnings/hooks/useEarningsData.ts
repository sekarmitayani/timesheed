import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { EnrichedContract } from "../types";

export function useEarningsData(userId: string | undefined, rolePrefix: string = "earnings") {
    const { data: response, isLoading } = useQuery({
        queryKey: [rolePrefix, 'earnings', userId],
        queryFn: async () => {
            if (!userId) return null;
            return fetchApi("/my-earnings");
        },
        enabled: !!userId,
    });

    const data = response?.data || {};

    const enrichedContracts: EnrichedContract[] = (data.contracts || []).map((c: any) => {
        const total_earned = c.calculated_target ?? c.total_earned ?? 0;
        const total_paid = c.total_paid ?? 0;
        const remaining = c.remaining ?? c.total_liability ?? Math.max(0, Number(total_earned) - Number(total_paid));
        return {
            ...c,
            total_earned: Number(total_earned) || 0,
            total_paid: Number(total_paid) || 0,
            payment_status: c.status || c.payment_status || "pending",
            total_liability: Number(remaining) || 0,
            remaining: Number(remaining) || 0,
            payments: c.payments || [],
        };
    });

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

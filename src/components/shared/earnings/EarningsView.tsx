"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { EarningsKpis } from "./components/EarningsKpis";
import { ContractAccordion } from "./components/ContractAccordion";
import { PaymentHistory } from "./components/PaymentHistory";
import { EarningsHeader } from "./components/EarningsHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useEarningsData } from "./hooks/useEarningsData";

interface EarningsViewProps {
    rolePrefix?: string;
}

export function EarningsView({ rolePrefix = "earnings" }: EarningsViewProps) {
    const user = useAuthStore((s) => s.user);
    const { 
        enrichedContracts, 
        isLoading, 
        myPayments, 
        totalEarned, 
        currentMonthReleased, 
        totalLiability 
    } = useEarningsData(user?.id, rolePrefix);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-20 w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <EarningsHeader />

            <EarningsKpis 
                currentMonthReleased={currentMonthReleased}
                totalLiability={totalLiability}
                totalEarned={totalEarned}
            />

            <ContractAccordion contracts={enrichedContracts} />
            <PaymentHistory payments={myPayments} />
        </div>
    );
}

export default EarningsView;

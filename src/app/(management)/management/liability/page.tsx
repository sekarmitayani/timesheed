"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ai/ai-components";
import { useLiabilityMonitor } from "./hooks/useLiabilityData";
import { LiabilityStats } from "./components/LiabilityStats";
import { LiabilityAccordion } from "./components/LiabilityAccordion";
import { LiabilityDetailModal } from "./components/LiabilityDetailModal";
import { Loader2 } from "lucide-react";

export default function LiabilityMonitorPage() {
    const { data, isLoading } = useLiabilityMonitor();
    
    const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Liability Monitor"
                description="Monitor unpaid liabilities, current month releases, and all-time released funds per project."
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p>Calculating financial liabilities...</p>
                </div>
            ) : data ? (
                <>
                    <LiabilityStats
                        totalLiability={data.total_liability}
                        totalReleasedAllTime={data.total_released_all_time}
                        totalReleasedCurrentMonth={data.total_released_current_month}
                    />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Project & Contract Details</h3>
                        <LiabilityAccordion 
                            groups={data.groups} 
                            onViewDetail={(id) => setSelectedContractId(id)}
                        />
                    </div>
                </>
            ) : null}

            <LiabilityDetailModal 
                contractId={selectedContractId}
                open={!!selectedContractId}
                onOpenChange={(open) => !open && setSelectedContractId(null)}
            />
        </div>
    );
}

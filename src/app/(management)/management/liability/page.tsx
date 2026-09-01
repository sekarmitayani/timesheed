"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ai/ai-components";
import { useLiabilityMonitor } from "./hooks/useLiabilityData";
import { LiabilityStats } from "./components/LiabilityStats";
import { LiabilityFilters } from "./components/LiabilityFilters";
import { LiabilityAccordion } from "./components/LiabilityAccordion";
import { LiabilityDetailModal } from "./components/LiabilityDetailModal";
import { Loader2 } from "lucide-react";

export default function LiabilityMonitorPage() {
    const { data, isLoading } = useLiabilityMonitor();
    
    const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
    const [search, setSearch] = useState<string>("");
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");

    // Filter groups and members based on user search and filters
    const filteredGroups = useMemo(() => {
        if (!data?.groups) return [];

        const q = search.trim().toLowerCase();

        return data.groups
            .filter((g) => {
                // Project filter
                if (filterProject !== "all") {
                    const gId = g.project_id !== null ? String(g.project_id) : "base";
                    if (gId !== filterProject) return false;
                }
                return true;
            })
            .map((g) => {
                // Member-level filter
                const matchedMembers = g.members.filter((m) => {
                    // Type filter
                    if (filterType !== "all") {
                        const mType = (m.contract_type || "").toLowerCase().replace(/_/g, "").replace(/-/g, "");
                        const fType = filterType.toLowerCase().replace(/_/g, "").replace(/-/g, "");
                        if (!mType.includes(fType)) return false;
                    }

                    // Search query: match member name, email, or project name
                    if (q) {
                        const nameMatch = m.full_name?.toLowerCase().includes(q);
                        const emailMatch = m.email?.toLowerCase().includes(q);
                        const projMatch = g.project_name?.toLowerCase().includes(q);
                        if (!nameMatch && !emailMatch && !projMatch) return false;
                    }

                    return true;
                });

                const groupReleased = matchedMembers.reduce((acc, m) => acc + (m.total_released || 0), 0);
                const groupLiability = matchedMembers.reduce((acc, m) => acc + (m.total_liability || 0), 0);

                return {
                    ...g,
                    released: q || filterType !== "all" ? groupReleased : g.released,
                    liability: q || filterType !== "all" ? groupLiability : g.liability,
                    members: matchedMembers,
                };
            })
            .filter((g) => g.members.length > 0 || (!q && filterType === "all" && filterProject === "all"));
    }, [data?.groups, search, filterProject, filterType]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Liability Monitor"
                description="Monitor unpaid liabilities, current month releases, and all-time released funds per project."
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#2568C1]" />
                    <p className="text-xs font-medium text-slate-500">Calculating financial liabilities & contract exposure...</p>
                </div>
            ) : data ? (
                <>
                    <LiabilityStats
                        totalLiability={data.total_liability}
                        totalReleasedAllTime={data.total_released_all_time}
                        totalReleasedCurrentMonth={data.total_released_current_month}
                    />

                    <LiabilityFilters
                        search={search}
                        setSearch={setSearch}
                        filterProject={filterProject}
                        setFilterProject={setFilterProject}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        groups={data.groups || []}
                    />

                    <div className="space-y-3">
                        <LiabilityAccordion 
                            groups={filteredGroups} 
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


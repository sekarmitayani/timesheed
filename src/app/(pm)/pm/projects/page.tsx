"use client";

import { FolderKanban, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ai/ai-components";
import { usePMProjectsData } from "./hooks/usePMProjectsData";
import { PMProjectFilters } from "./components/PMProjectFilters";
import { PMProjectCard } from "./components/PMProjectCard";

export default function PMProjectsPage() {
    const { state, actions } = usePMProjectsData();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="My Projects" 
                description={`You are managing ${state.pagination.total} projects`}
            />

            {/* Filters */}
            <PMProjectFilters 
                search={state.search}
                setSearch={actions.setSearch}
                statusFilter={state.statusFilter}
                setStatusFilter={actions.setStatusFilter}
                filteredCount={state.cards.length}
            />

            {/* Content */}
            {state.isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] opacity-40" />
                </div>
            ) : state.cards.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-60">
                        <div className="bg-slate-100 p-5 rounded-full">
                            <FolderKanban className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {state.search || state.statusFilter !== "All"
                                ? "No projects match your filters."
                                : "No projects assigned to you yet."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                    {state.cards.map((card) => (
                        <PMProjectCard 
                            key={card.project.id} 
                            data={card} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

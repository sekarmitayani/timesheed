"use client";

import { PageHeader } from "@/components/ai/ai-components";
import { FolderKanban, Loader2 } from "lucide-react";
import { useProjectsData } from "./hooks/useProjectsData";
import { ProjectFilters } from "./components/ProjectFilters";
import { ProjectCard } from "./components/ProjectCard";

export default function EmployeeProjectsPage() {
    const { state, computed, actions } = useProjectsData();

    return (
        <div className="flex flex-col w-full gap-4 h-full overflow-hidden">
            <PageHeader
                title="My Projects"
                description="Projects you're currently assigned to."
            />

            {/* Filters */}
            <ProjectFilters 
                searchQuery={state.searchQuery}
                setSearchQuery={actions.setSearchQuery}
                filterStatus={state.filterStatus}
                setFilterStatus={actions.setFilterStatus}
                filteredCount={computed.filteredCards.length}
            />

            {/* Content */}
            {state.isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] opacity-40" />
                </div>
            ) : computed.filteredCards.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 opacity-60">
                        <div className="bg-slate-100 p-5 rounded-full">
                            <FolderKanban className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {state.searchQuery || state.filterStatus !== "all"
                                ? "No projects match your filters."
                                : "No projects assigned yet."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Contact your project manager to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {computed.filteredCards.map((card) => (
                            <ProjectCard key={card.project.id} data={card} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

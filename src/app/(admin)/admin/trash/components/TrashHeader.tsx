"use client";

import React from "react";
import { 
    UserCog, 
    FolderKanban, 
    ReceiptText, 
    Package 
} from "lucide-react";
import { PageHeader } from "@/components/ai/ai-components";
import { TrashTabType, TrashSummary } from "@/lib/services/trash-service";
import { cn } from "@/lib/utils";

interface TrashHeaderProps {
    activeTab: TrashTabType;
    onTabChange: (tab: TrashTabType) => void;
    summary: TrashSummary;
}

export function TrashHeader({ activeTab, onTabChange, summary }: TrashHeaderProps) {
    const totalCount = (summary.users || 0) + (summary.projects || 0) + (summary.contracts || 0) + (summary.resources || 0);

    const tabs = [
        { id: "users" as TrashTabType, label: "Users", icon: UserCog, count: summary.users },
        { id: "projects" as TrashTabType, label: "Projects", icon: FolderKanban, count: summary.projects },
        { id: "contracts" as TrashTabType, label: "Contracts", icon: ReceiptText, count: summary.contracts },
        { id: "resources" as TrashTabType, label: "Resource Requests", icon: Package, count: summary.resources },
    ];

    return (
        <div className="space-y-4 mb-2">
            {/* Standard Page Header matching all other admin pages */}
            <PageHeader 
                title="Trash & Restore" 
                description={`Managing ${totalCount} archived and deleted records`}
            />

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full sm:w-fit overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                isActive 
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", isActive ? "text-[#2568C1]" : "text-slate-400")} />
                            <span>{tab.label}</span>
                            <span className={cn(
                                "px-1.5 py-0.2 text-[10px] rounded-full font-bold",
                                isActive 
                                    ? "bg-[#2568C1]/10 text-[#2568C1]" 
                                    : "bg-slate-200 text-slate-600"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

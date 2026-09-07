"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FolderKanban } from "lucide-react";

interface PMProjectFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    filteredCount: number;
}

export function PMProjectFilters({
    search, setSearch,
    statusFilter, setStatusFilter,
    filteredCount
}: PMProjectFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[240px] md:w-[260px] shrink-0 p-0.5">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search your projects..."
                        className="pl-9 h-10 w-full bg-white border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px] h-10 bg-white text-sm border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="hidden md:flex text-[11px] text-muted-foreground font-bold uppercase tracking-wider items-center gap-1.5 shrink-0">
                <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                {filteredCount} project{filteredCount !== 1 ? "s" : ""}
            </div>
        </div>
    );
}


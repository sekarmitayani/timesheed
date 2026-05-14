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
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-1 pl-1">
            <div className="relative w-full sm:w-[250px] shrink-0">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search your projects..."
                    className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1] focus-visible:border-[#2568C1]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] h-10 bg-white border-slate-200">
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
            <div className="ml-auto text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                {filteredCount} project{filteredCount !== 1 ? "s" : ""}
            </div>
        </div>
    );
}

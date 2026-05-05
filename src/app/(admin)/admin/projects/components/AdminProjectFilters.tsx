"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FolderKanban } from "lucide-react";

interface AdminProjectFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    filteredCount: number;
}

export function AdminProjectFilters({
    search, setSearch,
    statusFilter, setStatusFilter,
    filteredCount
}: AdminProjectFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by project or client..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none focus-visible:ring-[#2568C1]"
                />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On-Hold">On Hold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            <div className="ml-auto text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                {filteredCount} project{filteredCount !== 1 ? "s" : ""}
            </div>
        </div>
    );
}

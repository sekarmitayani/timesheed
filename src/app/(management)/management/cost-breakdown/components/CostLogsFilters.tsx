import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface CostLogsFiltersProps {
    search: string;
    setSearch: (v: string) => void;
    categoryFilter: string;
    setCategoryFilter: (v: string) => void;
    limit: number;
    setLimit: (v: number) => void;
    setPage: (v: number) => void;
}

export function CostLogsFilters({
    search, setSearch,
    categoryFilter, setCategoryFilter,
    limit, setLimit, setPage
}: CostLogsFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1 mb-4">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Detailed Cost Log</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-[250px] shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-9 h-9 w-full bg-white border-slate-200 text-sm focus-visible:ring-[#4B7BEC]"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-9 w-full sm:w-[150px] bg-white text-sm">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="manpower">Manpower</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="h-9 w-full sm:w-[70px] bg-white text-xs border-slate-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[70px]">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

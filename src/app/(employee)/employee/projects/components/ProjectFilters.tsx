import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FolderKanban } from "lucide-react";

interface ProjectFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    filteredCount: number;
}

export function ProjectFilters({
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredCount
}: ProjectFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by project or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none"
                />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] h-9 text-xs border-[#E2E8F0] rounded-[6px] bg-white shadow-none">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            <div className="ml-auto text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                {filteredCount} project{filteredCount !== 1 ? "s" : ""}
            </div>
        </div>
    );
}

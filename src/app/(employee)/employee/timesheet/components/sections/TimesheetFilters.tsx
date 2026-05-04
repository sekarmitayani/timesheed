import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, RefreshCcw } from "lucide-react";

interface TimesheetFiltersProps {
    filterType: string;
    setFilterType: (val: string) => void;
    dateFrom: string;
    setDateFrom: (val: string) => void;
    dateTo: string;
    setDateTo: (val: string) => void;
    filterProject: string;
    filterStatus: string;
    resetFilters: () => void;
}

export function TimesheetFilters({
    filterType,
    setFilterType,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filterProject,
    filterStatus,
    resetFilters
}: TimesheetFiltersProps) {
    const hasActiveFilters = filterType !== "all" || dateFrom || dateTo || filterProject !== "all" || filterStatus !== "all";

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 p-2 border border-[#E2E8F0] rounded-[6px] shrink-0">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#4B7BEC]" />
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px] h-8 text-xs border-none bg-transparent shadow-none focus:ring-0 font-bold">
                            <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Records</SelectItem>
                            <SelectItem value="daily">Daily View</SelectItem>
                            <SelectItem value="weekly">Weekly View</SelectItem>
                            <SelectItem value="monthly">Monthly View</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Range:</span>
                    <div className="flex flex-wrap items-center gap-1">
                        <Input 
                            type="date" 
                            className="h-8 w-[145px] text-[11px] border-[#E2E8F0] rounded-[4px] bg-white shadow-none px-2" 
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <span className="text-muted-foreground text-[10px] mx-1">to</span>
                        <Input 
                            type="date" 
                            className="h-8 w-[145px] text-[11px] border-[#E2E8F0] rounded-[4px] bg-white shadow-none px-2" 
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {hasActiveFilters && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-[10px] text-[#4B7BEC] font-bold uppercase hover:bg-[#4B7BEC]/5 h-8 px-3 gap-1.5"
                >
                    <RefreshCcw className="h-3 w-3" /> Reset All
                </Button>
            )}
        </div>
    );
}

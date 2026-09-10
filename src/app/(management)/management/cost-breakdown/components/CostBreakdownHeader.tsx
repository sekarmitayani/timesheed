import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CostBreakdownHeaderProps {
    daysFilter: string;
    setDaysFilter: (v: string) => void;
    categoryFilter: string;
    setCategoryFilter: (v: string) => void;
}

export function CostBreakdownHeader({
    daysFilter, setDaysFilter,
    categoryFilter, setCategoryFilter
}: CostBreakdownHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cost Breakdown</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Detailed analysis of operational and resource expenditures.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="salary">Salary (Contract)</SelectItem>
                        <SelectItem value="manpower">Manpower</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={daysFilter} onValueChange={setDaysFilter}>
                    <SelectTrigger className="w-[150px] bg-white border-slate-200">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30">1 Month</SelectItem>
                        <SelectItem value="90">3 Months</SelectItem>
                        <SelectItem value="180">6 Months</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

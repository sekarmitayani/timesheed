"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CustomDateRangePicker } from "@/components/shared/CustomDateRangePicker";
import { CostEntry } from "../hooks/useAdminProjectDetailData";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AdminCostsTabProps {
    costs: CostEntry[];
    isLoading?: boolean;
    filterType: string;
    setFilterType: (v: any) => void;
    filterStart: string;
    setFilterStart: (v: string) => void;
    filterEnd: string;
    setFilterEnd: (v: string) => void;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const cleanDate = dateStr.split("T")[0];
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year.slice(-2)}`;
    }
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return format(d, "dd/MM/yy");
    } catch {
        return dateStr;
    }
};

export function AdminCostsTab({
    costs, isLoading, filterType, setFilterType, filterStart, setFilterStart, filterEnd, setFilterEnd
}: AdminCostsTabProps) {
    const total = costs.reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-slate-800">Project Cost Breakdown</h2>
                    <p className="text-xs text-slate-500">Comprehensive log of salaries and approved resources.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Costs</SelectItem>
                            <SelectItem value="Salary">Salary</SelectItem>
                            <SelectItem value="Resource">Resource</SelectItem>
                        </SelectContent>
                    </Select>
                    <CustomDateRangePicker 
                        dateFrom={filterStart} 
                        dateTo={filterEnd} 
                        onDateChange={(from, to) => {
                            setFilterStart(from);
                            setFilterEnd(to);
                        }}
                        align="end"
                    />
                </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-slate-50/50">
                                <TableHead className="pl-6 w-[60px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                <TableHead className="w-[180px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Date</TableHead>
                                <TableHead className="w-[120px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Description</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                                <TableHead className="w-40 pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2568C1]" />
                                    </TableCell>
                                </TableRow>
                            ) : costs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-slate-400 text-center">
                                        No records found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {costs.map((c, index) => (
                                        <TableRow key={c.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                            <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-semibold text-slate-700">{formatDate(c.date)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`capitalize text-[10px] font-bold px-2.5 py-0.5 tracking-wider w-fit rounded-full border-none 
                                                    ${c.type === 'Salary' ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"}`}>
                                                    {c.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[11px] text-slate-500 font-medium">{c.user}</span>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <span className="text-sm font-bold text-slate-800 tracking-tight">Rp {c.amount.toLocaleString("id-ID")}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50/50 border-t border-slate-100">
                                        <TableCell colSpan={5} className="pl-6 py-4 font-bold text-right text-slate-500 uppercase tracking-widest text-[10px]">
                                            Grand Total Overview
                                        </TableCell>
                                        <TableCell className="py-4 pr-6 font-black text-[#2568C1] text-right text-base">
                                            Rp {total.toLocaleString("id-ID")}
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

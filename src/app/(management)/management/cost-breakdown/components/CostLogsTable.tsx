import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CostLogItem } from "@/lib/services/management-service";

interface CostLogsTableProps {
    logs: CostLogItem[];
    isLoading: boolean;
    pagination: { page: number, limit: number, total: number };
    setPage: (p: number) => void;
}

export function CostLogsTable({
    logs, isLoading, pagination, setPage
}: CostLogsTableProps) {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    const fmtCurrency = (v: number) => {
        return `Rp ${v.toLocaleString("id-ID")}`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getCategoryBadge = (category: string) => {
        const catLower = category.toLowerCase();
        if (catLower.includes('salary')) {
            return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-bold tracking-wider">{category}</Badge>;
        }
        if (catLower.includes('manpower')) {
            return <Badge variant="outline" className="bg-[#4B7BEC] text-white border-none text-[10px] font-bold tracking-wider">{category}</Badge>;
        }
        if (catLower.includes('infrastructure')) {
            return <Badge variant="outline" className="bg-blue-50 text-[#4B7BEC] border-none text-[10px] font-bold tracking-wider">{category}</Badge>;
        }
        if (catLower.includes('accommodation')) {
            return <Badge variant="outline" className="bg-slate-100 text-slate-500 border-none text-[10px] font-bold tracking-wider">{category}</Badge>;
        }
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-none text-[10px] font-bold tracking-wider">{category}</Badge>;
    };

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50 border-b-slate-100">
                            <TableHead className="pl-6 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10 w-[50px]">NO</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Expense Name</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Category</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Payment Scheme</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Date</TableHead>
                            <TableHead className="pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#4B7BEC] mb-4" />
                                        <p className="text-sm font-medium">Loading cost logs...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-slate-400 text-center font-medium text-sm">
                                    No cost records found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, idx) => (
                                <TableRow key={log.id} className="hover:bg-[#f8fafc] transition-colors border-b-slate-50">
                                    <TableCell className="pl-6 text-xs text-slate-500 font-medium w-[50px]">
                                        {(pagination.page - 1) * pagination.limit + idx + 1}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-800 font-semibold max-w-[200px] truncate">
                                        {log.expense_name}
                                    </TableCell>
                                    <TableCell>
                                        {getCategoryBadge(log.category)}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600 font-medium">
                                        {log.project_name}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600">
                                        {log.payment_scheme}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {formatDate(log.date)}
                                    </TableCell>
                                    <TableCell className="pr-6 text-right text-xs font-bold text-slate-900">
                                        {fmtCurrency(log.amount)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <span className="font-medium text-[#0f172a]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#0f172a]">{pagination.total}</span> entries
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={pagination.page <= 1}
                            onClick={() => setPage(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-medium px-2">
                            Page {pagination.page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={pagination.page >= totalPages}
                            onClick={() => setPage(pagination.page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, ChevronLeft, ChevronRight, WalletCards } from "lucide-react";
import { TableSkeleton } from "@/components/shared/loaders/TableSkeleton";
import { PayrollSummaryItem } from "@/lib/services/admin-contracts";

interface PayrollTableProps {
    contracts: PayrollSummaryItem[];
    isLoading: boolean;
    page: number;
    limit: number;
    totalPages: number;
    totalFiltered: number;
    onExecute: (c: PayrollSummaryItem) => void;
    setPage: (p: number | ((prev: number) => number)) => void;
}

const formatNumber = (value: number | string): string => {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : String(value);
    if (!num) return "0";
    return Number(num).toLocaleString("id-ID");
};

const getRateSuffix = (type: string) => {
    switch (type) {
        case 'monthly': return 'per month';
        case 'yearly': return 'per year';
        case 'timesheet': return 'per hour';
        case 'mandays': return 'per day';
        default: return '';
    }
};

export function PayrollTable({
    contracts,
    isLoading,
    page,
    limit,
    totalPages,
    totalFiltered,
    onExecute,
    setPage
}: PayrollTableProps) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <Table className="min-w-[760px]">
                <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                        <TableHead className="pl-6 w-[60px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                        <TableHead className="min-w-[170px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Scheme / Project</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Unpaid Ledger / Rate</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                        <TableHead className="w-32 pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={6} rows={6} hasAvatar={true} hasActions={true} />
                        ) : contracts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-slate-400 text-center">
                                    No payroll records matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contracts.map((c, index) => {
                                const globalIndex = (page - 1) * limit + index + 1;
                                return (
                                    <TableRow key={c.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                            {globalIndex}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-3 items-center">
                                                <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                        {(c.full_name || "U").substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">{c.full_name}</span>
                                                    <span className="text-[11px] text-slate-400 capitalize">
                                                        {c.contract_type} Contract
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <Badge variant="outline" className={`capitalize text-[10px] font-bold px-2.5 py-0.5 tracking-wider w-fit rounded-full border-none 
                                                    ${c.payment_scheme === 'back_to_back' ? "bg-teal-50 text-teal-700" : 
                                                      c.payment_scheme === 'monthly' ? "bg-blue-50 text-blue-700" : 
                                                      "bg-indigo-50 text-indigo-700"}`}>
                                                    {c.payment_scheme === 'back_to_back' ? 'Back-to-back' : c.payment_scheme === 'monthly' ? 'Monthly' : 'Termin'}
                                                </Badge>
                                                <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[150px]">
                                                    {c.project_name || "Base Contract"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-rose-600 tracking-tight">Rp {formatNumber(Math.max(0, c.calculated_target - c.total_paid))}</span>
                                                <span className="text-[10px] text-slate-400 italic">
                                                    Base: Rp {formatNumber(c.base_rate)} {getRateSuffix(c.contract_type)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`uppercase text-[10px] font-bold px-2.5 py-0.5 tracking-wider rounded-full border-none 
                                                ${c.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                  c.payment_status === 'partially_paid' ? 'bg-amber-50 text-amber-600' :
                                                  'bg-slate-100 text-slate-500'}`}>
                                                {c.payment_status === 'partially_paid' ? 'Partially Paid' : c.payment_status === 'paid' ? 'DONE' : 'PENDING'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button 
                                                size="sm" 
                                                className="h-8 text-xs bg-[#2568C1] hover:bg-[#1e56a6] w-auto px-4 gap-1 shadow-sm rounded-lg border-none" 
                                                onClick={() => onExecute(c)}
                                            >
                                                <WalletCards className="h-3 w-3" /> Execute
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

            {/* Pagination */}
            {!isLoading && totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/30 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{(page - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(page * limit, totalFiltered)}</span> of <span className="text-slate-900">{totalFiltered}</span> entries
                    </div>
                    <div className="flex items-center gap-2 sm:pr-14 md:pr-0">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={page <= 1} 
                            onClick={() => setPage(prev => Math.max(1, (prev as number) - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-semibold px-2 text-slate-700">
                            Page {page} of {totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(prev => Math.min(totalPages, (prev as number) + 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Contract } from "@/lib/services/admin-contracts";
import { User } from "@/lib/types";

interface ContractsTableProps {
    contracts: Contract[];
    isLoading: boolean;
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
    };
    allUsers: User[];
    onView: (c: Contract) => void;
    onEdit: (c: Contract) => void;
    onDelete: (c: Contract) => void;
    setPage: (p: number) => void;
    totalContracts: number;
}

const fmtDate = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const formatNumber = (value: number | string): string => {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : String(value);
    if (!num) return "";
    return Number(num).toLocaleString("id-ID");
};

const paymentSchemeLabel = (s: string) => {
    switch (s) {
        case "back_to_back": return "Back-to-back";
        case "termin": return "Termin";
        case "monthly": return "Monthly";
        default: return s;
    }
};

export function ContractsTable({
    contracts,
    isLoading,
    pagination,
    allUsers,
    onView,
    onEdit,
    onDelete,
    setPage,
    totalContracts
}: ContractsTableProps) {
    const getUserContext = (userId: number) => {
        return allUsers.find(u => Number(u.id) === userId);
    };

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/50">
                            <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                            <TableHead className="w-[280px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Payment Scheme</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Period & Rate</TableHead>
                            <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                            <TableHead className="w-[140px] pr-6 text-right text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                        <p>Gathering contracts records...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : contracts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-slate-400 text-center">
                                    No contracts matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contracts.map((c, index) => {
                                const globalIndex = (pagination.page - 1) * pagination.limit + index + 1;
                                const uContext = getUserContext(c.user_id);
                                return (
                                    <TableRow key={c.id} className="hover:bg-[#f0f4fa]/50 transition-colors border-b border-slate-100 last:border-0">
                                        <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                            {globalIndex}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-3 items-center">
                                                <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                        {(uContext?.full_name || uContext?.name || "U").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">{uContext?.full_name || uContext?.name || `User #${c.user_id}`}</span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {uContext?.email || "Unknown Email"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none text-[10px] w-fit
                                                ${c.contract_type === 'timesheet' ? "bg-slate-100 text-slate-600" :
                                                  c.contract_type === 'monthly' ? "bg-indigo-50 text-indigo-600" :
                                                  c.contract_type === 'yearly' ? "bg-purple-50 text-purple-600" :
                                                  "bg-blue-50 text-blue-600"}`} variant="outline">
                                                {c.contract_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none text-[10px] w-fit
                                                ${c.payment_scheme === 'monthly' ? "bg-blue-50 text-blue-600" :
                                                  c.payment_scheme === 'termin' ? "bg-emerald-50 text-emerald-600" :
                                                  "bg-amber-50 text-amber-600"}`} variant="outline">
                                                {paymentSchemeLabel(c.payment_scheme || "")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-slate-700 tracking-tight">Rp {formatNumber(c.rate_amount)}</span>
                                                <span className="text-[10px] text-slate-400 uppercase flex gap-1">
                                                    {fmtDate(c.start_date)} &rarr; {c.end_date ? fmtDate(c.end_date) : "Present"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 border-none ${c.is_active
                                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                                {c.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => onView(c)} title="View Contract Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => onEdit(c)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => onDelete(c)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && pagination.totalPages > 0 && (
                <div className="border-t border-[#e2e8f0] bg-slate-50/30 px-6 py-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-slate-900">{Math.min(pagination.page * pagination.limit, totalContracts)}</span> of <span className="text-slate-900">{totalContracts}</span> contracts
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={pagination.page <= 1} 
                            onClick={() => setPage(pagination.page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-semibold px-2 text-slate-700">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 border-slate-200" 
                            disabled={pagination.page >= pagination.totalPages} 
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

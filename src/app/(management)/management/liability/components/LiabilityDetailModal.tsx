import { format } from "date-fns";
import { formatRupiah } from "@/lib/utils";
import { useLiabilityContractDetail } from "../hooks/useLiabilityData";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Mail,
    Phone,
    Calendar,
    Briefcase,
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertCircle,
    Wallet,
    Loader2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LiabilityDetailModalProps {
    contractId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LiabilityDetailModal({ contractId, open, onOpenChange }: LiabilityDetailModalProps) {
    const { data: detail, isLoading, error } = useLiabilityContractDetail(contractId);

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-white p-0 gap-0 border-[#e2e8f0] shadow-xl rounded-md">
                <div className="px-6 pr-12 py-4 sticky top-0 bg-[#f8fafc] z-10 border-b border-[#e2e8f0] flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <DialogTitle className="text-base font-bold text-slate-800">
                            Contract Liability Detail
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 font-medium">
                            Overview of employee contract liabilities, period earnings, and payment logs
                        </DialogDescription>
                    </div>
                </div>

                {isLoading && (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#4B7BEC]" />
                        <p className="text-sm font-medium">Loading contract details...</p>
                    </div>
                )}

                {error && (
                    <div className="p-12 flex flex-col items-center justify-center text-red-500">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p className="text-sm font-medium">Failed to load contract details. Please try again.</p>
                    </div>
                )}

                {!isLoading && !error && detail && (
                    <div className="px-6 pt-3.5 pb-6 space-y-6">
                        {/* 1. Identity & Contract Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Profile Info */}
                            <div className="space-y-2">
                                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">User Identity</h3>
                                <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex gap-3 items-start">
                                        <Avatar className="h-10 w-10 border-none shadow-sm bg-gradient-to-br from-[#2568C1] to-[#1a4f99]">
                                            <AvatarFallback className="bg-transparent text-white font-bold text-base">
                                                {getInitials(detail.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="pt-0.5">
                                            <p className="font-bold text-slate-800 text-base leading-none mb-1">{detail.user_name}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Mail className="w-3.5 h-3.5" /> 
                                                <span>{detail.user_email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-medium">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" /> 
                                        <span>{detail.user_phone || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Info */}
                            <div className="space-y-2">
                                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Contract Details</h3>
                                <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm grid grid-cols-2 gap-y-3 gap-x-4">
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" /> Project
                                        </p>
                                        <p className="font-bold text-slate-800 text-xs">{detail.project_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Started On
                                        </p>
                                        <p className="font-bold text-slate-800 text-xs">
                                            {format(new Date(detail.start_date), "dd MMM yyyy")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 mb-1">Type & Scheme</p>
                                        <div className="flex flex-col items-start gap-1">
                                            <Badge variant="outline" className="bg-white text-slate-500 text-[9px] uppercase font-bold border-slate-200 px-1.5 py-0">
                                                {detail.contract_type.replace(/_/g, " ")}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white text-[#4B7BEC] text-[9px] uppercase font-bold border-blue-100 px-1.5 py-0">
                                                {detail.payment_scheme.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Rate
                                        </p>
                                        <p className="font-bold text-[#4B7BEC] text-base leading-none mt-0.5">{formatRupiah(detail.rate_amount)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 py-4 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center min-w-0">
                                <p className="text-xs font-medium text-slate-500 mb-1 truncate">Target Earned</p>
                                <h4 className="text-xl font-bold text-slate-900 break-words">{formatRupiah(detail.calculated_target)}</h4>
                            </div>
                            <div className="bg-emerald-50/30 p-4 py-4 rounded-md border border-emerald-100 shadow-sm flex flex-col justify-center min-w-0">
                                <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1.5 truncate">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Total Released
                                </p>
                                <h4 className="text-xl font-bold text-emerald-700 break-words">{formatRupiah(detail.total_paid)}</h4>
                            </div>
                            <div className="bg-amber-50/30 p-4 py-4 rounded-md border border-amber-100 shadow-sm flex flex-col justify-center min-w-0">
                                <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1.5 truncate">
                                    <Clock className="w-4 h-4 shrink-0" /> Pending Liability
                                </p>
                                <h4 className="text-xl font-bold text-amber-700 break-words">{formatRupiah(detail.remaining)}</h4>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* 3. Payment Breakdown */}
                        <div className="space-y-2.5">
                            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                Period Breakdown
                            </h3>
                            <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9 pl-4">Period</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9 text-right">Earned</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9 text-right">Paid</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9 text-center pr-4">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(!detail.monthly_breakdown || detail.monthly_breakdown.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-slate-500 text-xs">
                                                    No periods recorded yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            detail.monthly_breakdown.map((b, i) => (
                                                <TableRow key={i} className="hover:bg-slate-50/50">
                                                    <TableCell className="font-semibold text-slate-800 text-xs pl-4">
                                                        {b.period_name}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-slate-800 text-xs">
                                                        {formatRupiah(b.earned)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600 text-xs">
                                                        {formatRupiah(b.paid)}
                                                    </TableCell>
                                                    <TableCell className="text-center pr-4">
                                                        <Badge variant="outline" className={
                                                            b.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px]" :
                                                            b.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200 text-[9px]" :
                                                            "bg-blue-50 text-[#4B7BEC] border-blue-200 text-[9px]"
                                                        }>
                                                            {b.status.replace(/_/g, " ")}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* 4. Payment Logs */}
                        <div className="space-y-2.5 pb-2">
                            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-slate-400" />
                                Payment Logs
                            </h3>
                            <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9 pl-4">Date</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9">Name</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9">Description</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-9 text-right pr-4">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(!detail.payment_log || detail.payment_log.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-slate-500 text-xs">
                                                    No payment history found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            detail.payment_log.map((log) => (
                                                <TableRow key={log.id} className="hover:bg-slate-50/50">
                                                    <TableCell className="text-slate-500 font-medium text-xs pl-4 whitespace-nowrap">
                                                        {format(new Date(log.paid_at), "dd MMM yyyy")}
                                                        <span className="text-slate-400 text-[10px] ml-2">{format(new Date(log.paid_at), "HH:mm")}</span>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-slate-800 text-xs">
                                                        {log.name}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 text-xs max-w-[200px] truncate" title={log.description}>
                                                        {log.description || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600 text-xs pr-4 whitespace-nowrap">
                                                        {formatRupiah(log.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

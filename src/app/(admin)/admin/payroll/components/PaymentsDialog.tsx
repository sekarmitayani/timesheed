"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
    Loader2, WalletCards, FileText, Calendar, Trash2, 
    ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
    ContractPayment, ContractSummary, PayrollSummaryItem, 
    MonthlyBreakdownItem 
} from "@/lib/services/admin-contracts";

interface PaymentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedContract: PayrollSummaryItem | null;
    contractSummary: ContractSummary | null;
    payments: ContractPayment[];
    monthlyBreakdown: MonthlyBreakdownItem[];
    isLoadingPayments: boolean;
    isSavingPayment: boolean;
    editingPaymentId: number | null;
    paymentForm: { name: string; amount: number; paid_at: string; description: string };
    setPaymentForm: (form: any) => void;
    onSave: (payload: any) => void;
    onDelete: (id: number) => void;
    onEdit: (p: ContractPayment) => void;
    resetForm: () => void;
}

const formatNumber = (value: number | string): string => {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : String(value);
    if (!num) return "0";
    return Number(num).toLocaleString("id-ID");
};

const fmtDate = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (d.includes("T") && (hours !== 0 || minutes !== 0)) {
        return format(date, "dd MMM yyyy, HH:mm");
    }
    return format(date, "dd MMM yyyy");
};

const summaryStatusColor = (s: string) => {
    if (s === "Paid" || s === "paid") return "bg-emerald-50 text-emerald-600 border-none";
    if (s === "PartiallyPaid" || s === "partially_paid") return "bg-amber-50 text-amber-600 border-none";
    return "bg-slate-100 text-slate-500 border-none";
};

export function PaymentsDialog({
    open, onOpenChange, selectedContract, contractSummary,
    payments, monthlyBreakdown, isLoadingPayments, isSavingPayment, editingPaymentId,
    paymentForm, setPaymentForm, onSave, onDelete, onEdit, resetForm
}: PaymentsDialogProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [editConfirmOpen, setEditConfirmOpen] = useState(false);
    const [overpayConfirmOpen, setOverpayConfirmOpen] = useState(false);

    const targetAmount = contractSummary?.contract_target ?? selectedContract?.calculated_target ?? 0;
    const currentPaid = contractSummary?.total_paid ?? selectedContract?.total_paid ?? 0;
    const remainingUnpaid = Math.max(0, targetAmount - currentPaid);

    // If editing, subtract old payment amount and add new amount
    const editingPreviousAmount = editingPaymentId 
        ? (payments.find(p => p.id === editingPaymentId)?.amount || 0)
        : 0;
    const projectedTotalPaid = currentPaid - editingPreviousAmount + (Number(paymentForm.amount) || 0);
    const isOverpaying = targetAmount > 0 && projectedTotalPaid > targetAmount;
    const excessAmount = Math.max(0, projectedTotalPaid - targetAmount);

    const handleDeleteConfirm = () => {
        if (deleteConfirmId !== null) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const handleSaveConfirm = () => {
        setEditConfirmOpen(false);
        onSave(paymentForm);
    };

    const handleOverpayConfirm = () => {
        setOverpayConfirmOpen(false);
        if (editingPaymentId) {
            setEditConfirmOpen(true);
        } else {
            onSave(paymentForm);
        }
    };

    const handleSubmit = () => {
        if (!paymentForm.name?.trim() || paymentForm.amount === null || paymentForm.amount === undefined || paymentForm.amount <= 0 || !paymentForm.paid_at) {
            toast.error("Please fill in all required fields with a valid payment amount");
            return;
        }

        if (isOverpaying) {
            setOverpayConfirmOpen(true);
            return;
        }

        if (editingPaymentId) {
            setEditConfirmOpen(true);
        } else {
            onSave(paymentForm);
        }
    };

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden border-[#e2e8f0] bg-white rounded-md shadow-xl">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex flex-col gap-1">
                    <DialogTitle className="text-base text-[#0f172a] font-bold">Ledger Distribution Window</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        User: <span className="font-semibold text-slate-700">{selectedContract?.full_name || "..."}</span>
                    </DialogDescription>
                </div>

                <div className="max-h-[85vh] overflow-y-auto">
                    {(contractSummary || selectedContract) && (
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Scheme</div>
                                    <Badge variant="outline" className={`text-[9px] font-bold rounded-full px-2.5 py-0.5 border-none ${selectedContract?.payment_scheme === 'back_to_back' ? "bg-teal-50 text-teal-700" : selectedContract?.payment_scheme === 'monthly' ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}>
                                        {selectedContract?.payment_scheme === 'back_to_back' ? 'Back-to-back' : selectedContract?.payment_scheme === 'monthly' ? 'Monthly' : 'Termin'}
                                    </Badge>
                                    <div className="text-[10px] text-slate-400 mt-0.5 capitalize">{selectedContract?.contract_type} Contract</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Base Rate</div>
                                    <div className="text-[11px] font-bold text-slate-600">
                                        Rp {formatNumber(selectedContract?.base_rate || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Project</div>
                                    <div className="text-sm font-semibold text-slate-700 truncate">{selectedContract?.project_name || 'Base Contract'}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Unpaid Ledger</div>
                                    <div className="text-sm font-black text-rose-600">
                                        Rp {formatNumber(remainingUnpaid)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Disbursed</div>
                                    <div className="text-sm font-black text-emerald-600">
                                        Rp {formatNumber(currentPaid)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</div>
                                    <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest rounded-full px-2.5 py-0.5 border-none ${summaryStatusColor(contractSummary?.status || selectedContract?.payment_status || "pending")}`}>
                                        {contractSummary?.status || selectedContract?.payment_status || "PENDING"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Monthly/Yearly Breakdown Accordion */}
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-[#2568C1]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Distribution Breakdown</span>
                                    </div>
                                    {showBreakdown ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                </button>

                                {showBreakdown && (
                                    <div className="mt-2 rounded-md border border-slate-200 bg-white overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Period</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Earned</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase">Paid</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlyBreakdown.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-3 py-4 text-center text-[10px] text-slate-400">No period data captured yet.</td>
                                                    </tr>
                                                ) : (
                                                    monthlyBreakdown.map((m, idx) => (
                                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30">
                                                            <td className="px-3 py-2">
                                                                <p className="text-[10px] font-bold text-slate-700">{m.period_name}</p>
                                                                <p className="text-[9px] text-slate-400">{m.year}</p>
                                                            </td>
                                                            <td className="px-3 py-2 text-[10px] font-medium text-slate-600">
                                                                Rp {formatNumber(m.earned)}
                                                            </td>
                                                            <td className="px-3 py-2 text-[10px] font-black text-[#2568C1]">
                                                                Rp {formatNumber(m.paid)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                <Badge variant="outline" className={`text-[8px] uppercase px-1.5 h-4 leading-none font-black border-none ${
                                                                    m.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 
                                                                    m.status === 'partially_paid' ? 'bg-amber-50 text-amber-600' : 
                                                                    'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {m.status.replace('_', ' ')}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    <div className="grid grid-cols-1 md:grid-cols-2 md:max-h-[50vh]">
                        {/* Transaction History Log */}
                        <div className="border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-5 space-y-4 overflow-y-auto max-h-[30vh] md:max-h-full">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Captured Transactions
                            </h4>

                            {isLoadingPayments ? (
                                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
                            ) : payments.length === 0 ? (
                                <Card className="p-6 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
                                    <p className="text-sm font-medium text-slate-500">Ledger is empty.</p>
                                    <p className="text-xs text-slate-400 mt-1">Record the first transaction.</p>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {payments.map(p => (
                                        <Card key={p.id} className="p-3.5 space-y-2 border border-slate-200 hover:border-emerald-300 transition-colors shadow-sm cursor-pointer bg-white" onClick={() => onEdit(p)}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-sm font-bold text-slate-800 tracking-tight block">{p.name}</span>
                                                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="h-2.5 w-2.5" /> {fmtDate(p.paid_at)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-sm font-black text-emerald-600 tracking-tight">Rp {formatNumber(p.amount)}</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:text-red-700 hover:bg-red-50" onClick={e => { e.stopPropagation(); setDeleteConfirmId(p.id); }} disabled={isSavingPayment}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {p.description && <p className="text-[11px] font-medium text-slate-500 leading-tight bg-slate-50 p-1.5 rounded">{p.description}</p>}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Insertion Form */}
                        <div className="p-6 space-y-5 overflow-y-auto bg-white">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between pb-2 border-b border-slate-100">
                                <span>{editingPaymentId ? "Edit Existing Entry" : "Insert Ledger Entry"}</span>
                                {editingPaymentId && (
                                    <Button variant="ghost" className="h-5 text-[10px] font-bold uppercase tracking-wider px-2 text-indigo-600 hover:bg-indigo-50" onClick={resetForm}>Abort Edit</Button>
                                )}
                            </h4>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Milestone Name / Identifier <span className="text-red-500">*</span></label>
                                    <Input className="h-9 text-sm border-slate-200" placeholder="e.g. Termin 1 (DP 30%)" value={paymentForm.name} onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })} disabled={isSavingPayment} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Financial Value (Rp) <span className="text-red-500">*</span></label>
                                    <CurrencyInput
                                        className="h-9 text-sm font-medium border-slate-200"
                                        placeholder="e.g. 5.000.000"
                                        value={paymentForm.amount || ""}
                                        onChange={(v: any) => {
                                            setPaymentForm({
                                                ...paymentForm,
                                                amount: Number(v) || 0,
                                            });
                                        }}
                                        disabled={isSavingPayment}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Execution Date <span className="text-red-500">*</span></label>
                                    <CustomDatePicker 
                                        date={paymentForm.paid_at || undefined} 
                                        onDateChange={date => setPaymentForm({ ...paymentForm, paid_at: date })} 
                                        disabled={isSavingPayment} 
                                        className="h-9 text-sm border-slate-200 text-slate-600 font-medium"
                                        placeholder="Select execution date"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Attached Description</label>
                                    <Input className="h-9 text-sm border-slate-200" placeholder="Optional notes regarding clearance..." value={paymentForm.description || ""} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} disabled={isSavingPayment} />
                                </div>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm h-10 mt-4 text-sm font-bold tracking-wide" onClick={handleSubmit} disabled={isSavingPayment}>
                                    {isSavingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPaymentId ? "Commit Changes" : "Commit Execution"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Overpayment Warning Confirmation Modal */}
        <Dialog open={overpayConfirmOpen} onOpenChange={setOverpayConfirmOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 pr-12 py-4 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-amber-200 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">
                            Disbursement Exceeds Required Amount
                        </DialogTitle>
                        <p className="text-xs text-amber-700/80">Excess payment warning</p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 space-y-3 text-sm text-slate-600">
                    <p className="text-xs text-slate-500">
                        The entered amount exceeds the remaining unpaid ledger for this contract. Please review the financial breakdown below:
                    </p>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Contract Target:</span>
                            <span className="font-bold text-slate-700">Rp {formatNumber(targetAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Current Total Paid:</span>
                            <span className="font-bold text-slate-700">Rp {formatNumber(currentPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Remaining Unpaid:</span>
                            <span className="font-bold text-rose-600">Rp {formatNumber(remainingUnpaid)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                            <span className="text-slate-700 font-bold">Disbursement Entered:</span>
                            <span className="font-bold text-[#2568C1]">Rp {formatNumber(paymentForm.amount)}</span>
                        </div>
                        <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-1.5 rounded">
                            <span>Excess / Overpayment:</span>
                            <span>+ Rp {formatNumber(excessAmount)}</span>
                        </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                        Are you sure you want to proceed with this disbursement?
                    </p>
                </div>
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button variant="outline" onClick={() => setOverpayConfirmOpen(false)} className="rounded-md">
                        Cancel
                    </Button>
                    <Button onClick={handleOverpayConfirm} className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px] rounded-md">
                        Confirm & Disburse
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                <div className="bg-red-50/60 border-b border-red-100 px-6 pr-12 py-4 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">Delete Ledger Entry?</DialogTitle>
                        <p className="text-xs text-red-600/80">Permanent data destruction</p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    This will permanently remove the payment record. 
                    This action represents permanent data destruction and cannot be undone.
                </div>
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-md">Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteConfirm} className="min-w-[120px] rounded-md">
                        Delete Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Confirmation Modal */}
        <Dialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 pr-12 py-4 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-amber-200 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">Confirm Changes?</DialogTitle>
                        <p className="text-xs text-amber-700/80">Update payment transaction</p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    Are you sure you want to commit these changes to the existing payment record?
                </div>
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button variant="outline" onClick={() => setEditConfirmOpen(false)} className="rounded-md">Cancel</Button>
                    <Button onClick={handleSaveConfirm} className="bg-amber-500 hover:bg-amber-600 min-w-[120px] rounded-md text-white">
                        Commit Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

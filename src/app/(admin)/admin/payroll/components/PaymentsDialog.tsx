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
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const summaryStatusColor = (s: string) => {
    if (s === "Paid") return "bg-emerald-50 text-emerald-600 border-none";
    if (s === "PartiallyPaid") return "bg-amber-50 text-amber-600 border-none";
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

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden border-[#e2e8f0] bg-white">
                <div className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 px-6 py-5 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-200">
                        <WalletCards className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg text-[#0f172a] mb-1">Ledger Distribution Window</DialogTitle>
                        <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            User: <span className="text-slate-700">{selectedContract?.full_name || "..."}</span>
                        </DialogDescription>
                    </div>
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
                                        Rp {formatNumber(Math.max(0, (contractSummary?.contract_target || selectedContract?.calculated_target || 0) - (contractSummary?.total_paid || selectedContract?.total_paid || 0)))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Disbursed</div>
                                    <div className="text-sm font-black text-emerald-600">
                                        Rp {formatNumber(contractSummary?.total_paid || selectedContract?.total_paid || 0)}
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
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-[#2568C1]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Distribution Breakdown</span>
                                    </div>
                                    {showBreakdown ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                </button>

                                {showBreakdown && (
                                    <div className="mt-2 rounded-lg border border-slate-200 bg-white overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
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
                                                        <Calendar className="h-2.5 w-2.5" /> {fmtDate(p.paid_at.split("T")[0])}
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
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm h-10 mt-4 text-sm font-bold tracking-wide" onClick={() => {
                                    if (!paymentForm.name?.trim() || paymentForm.amount === null || paymentForm.amount === undefined || !paymentForm.paid_at) {
                                        toast.error("Please fill in all required fields");
                                        return;
                                    }
                                    editingPaymentId ? setEditConfirmOpen(true) : onSave(paymentForm)
                                }} disabled={isSavingPayment}>
                                    {isSavingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPaymentId ? "Commit Changes" : "Commit Execution"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
            <DialogContent className="sm:max-w-md bg-white border-[#e2e8f0]">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-slate-800">Delete Ledger Entry?</DialogTitle>
                </DialogHeader>
                <div className="text-center text-sm text-slate-500 py-2">
                    This will permanently remove the payment record. 
                    This action represents data destruction and cannot be undone.
                </div>
                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-slate-200">Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteConfirm} className="bg-red-400/90 hover:bg-red-500 min-w-[120px]">
                        Delete Identity
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Confirmation Modal */}
        <Dialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
            <DialogContent className="sm:max-w-md bg-white border-[#e2e8f0]">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-slate-800">Confirm Changes?</DialogTitle>
                </DialogHeader>
                <div className="text-center text-sm text-slate-500 py-2">
                    Are you sure you want to commit these changes to the existing payment record?
                </div>
                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditConfirmOpen(false)} className="border-slate-200">Cancel</Button>
                    <Button onClick={handleSaveConfirm} className="bg-amber-500 hover:bg-amber-600 min-w-[120px]">
                        Commit Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

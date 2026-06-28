"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2 } from "lucide-react";
import { User } from "@/lib/types";

interface ContractFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editId: number | null;
    isSaving: boolean;
    form: any;
    setForm: (f: any) => void;
    allUsers: User[];
    onSave: () => void;
    onCancel: () => void;
}

export function ContractFormDialog({
    open,
    onOpenChange,
    editId,
    isSaving,
    form,
    setForm,
    allUsers,
    onSave,
    onCancel
}: ContractFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={v => !isSaving && onOpenChange(v)}>
            <DialogContent showCloseButton={false} className="sm:max-w-[550px] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <DialogTitle className="text-xl text-[#0f172a]">{editId ? "Edit Contract Data" : "New Contract Setup"}</DialogTitle>
                    <DialogDescription className="text-sm">
                        {editId ? "Modify existing employment terms" : "Bind a new employment rate to a user profile"}
                    </DialogDescription>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {!editId && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">User <span className="text-red-500">*</span></label>
                            <Select 
                                value={String(form.user_id || "")} 
                                onValueChange={v => setForm({ ...form, user_id: Number(v) })}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10">
                                    <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allUsers.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Contract Type</label>
                            <Select 
                                value={form.contract_type} 
                                onValueChange={(v: any) => setForm({ ...form, contract_type: v })}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10"><SelectValue placeholder="Select contract type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="mandays">Mandays</SelectItem>
                                    <SelectItem value="timesheet">Timesheet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Payment Scheme</label>
                            <Select 
                                value={form.payment_scheme} 
                                onValueChange={(v: any) => setForm({ ...form, payment_scheme: v })}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10"><SelectValue placeholder="Select payment scheme" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="termin">Termin</SelectItem>
                                    <SelectItem value="back_to_back">Back-to-back</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Rate Amount (Rp)</label>
                        <CurrencyInput
                            placeholder="e.g. 5.000.000"
                            value={form.rate_amount || ""}
                            onChange={(v: any) => setForm({ ...form, rate_amount: Number(v) || 0 })}
                            disabled={isSaving}
                            className="bg-white border-slate-200 h-10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Start Date</label>
                            <CustomDatePicker 
                                date={form.start_date} 
                                onDateChange={(date) => setForm({ ...form, start_date: date })} 
                                disabled={isSaving} 
                                className="h-10 px-3 py-2 text-sm bg-white border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">End Date</label>
                            <CustomDatePicker 
                                date={form.end_date || ""} 
                                onDateChange={(date) => setForm({ ...form, end_date: date })} 
                                disabled={isSaving} 
                                className="h-10 px-3 py-2 text-sm bg-white border-slate-200"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    {editId && (
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-amber-400 accent-amber-600" 
                                    checked={form.is_active} 
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })} 
                                />
                                This contract is currently <b>Active</b>
                            </label>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                    <Button 
                        onClick={onSave} 
                        disabled={isSaving} 
                        className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] transition-all duration-200 shadow-sm"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save Changes" : "Create Contract"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

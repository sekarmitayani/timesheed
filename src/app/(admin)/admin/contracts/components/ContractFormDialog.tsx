"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, AlertTriangle, Info, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { User, ApiProject } from "@/lib/types";
import { Contract } from "@/lib/services/admin-contracts";

interface ContractFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editId: number | null;
    isSaving: boolean;
    form: any;
    setForm: (f: any) => void;
    allUsers: User[];
    allProjects?: ApiProject[];
    allContracts?: Contract[];
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
    allProjects = [],
    allContracts = [],
    onSave,
    onCancel
}: ContractFormDialogProps) {
    // Filter projects assigned to the selected user
    const userProjects = useMemo(() => {
        if (!form.user_id) return [];
        return allProjects.filter(p => {
            if (!p.members || !p.members.length) return false;
            return p.members.some(m => Number(m.user_id) === Number(form.user_id));
        });
    }, [allProjects, form.user_id]);

    // Contextual alert based on user's existing contracts
    const contractNotice = useMemo(() => {
        if (!form.user_id) return null;

        const userActiveContracts = allContracts.filter(c => 
            Number(c.user_id) === Number(form.user_id) && 
            c.is_active && 
            (!editId || c.id !== editId)
        );

        const hasBaseRate = userActiveContracts.some(c => !c.project_id);

        if (form.project_id) {
            const hasExistingCustom = userActiveContracts.some(c => Number(c.project_id) === Number(form.project_id));
            const selectedProject = allProjects.find(p => Number(p.id) === Number(form.project_id));
            const projectName = selectedProject?.name || `Project #${form.project_id}`;

            if (hasExistingCustom) {
                return {
                    type: "warning" as const,
                    title: "Custom Contract Exists",
                    message: `User already has an active custom contract for "${projectName}".`
                };
            } else if (hasBaseRate) {
                return {
                    type: "info" as const,
                    title: "Base Rate Override",
                    message: `This custom rate will override the user's base rate specifically for "${projectName}".`
                };
            } else {
                return {
                    type: "info" as const,
                    title: "Project Custom Rate",
                    message: `This rate applies exclusively to "${projectName}". User currently has no general base rate.`
                };
            }
        } else {
            if (hasBaseRate) {
                return {
                    type: "warning" as const,
                    title: "Active Base Rate Exists",
                    message: "User already has an active base rate. Creating another will register an additional general contract."
                };
            }
            return {
                type: "info" as const,
                title: "General Base Rate",
                message: "This contract will be applied as the default Base Rate across projects without custom rates."
            };
        }
    }, [form.user_id, form.project_id, allContracts, allProjects, editId]);

    return (
        <Dialog open={open} onOpenChange={v => !isSaving && onOpenChange(v)}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                {/* Modal Header */}
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 shrink-0">
                    <DialogTitle className="text-lg font-bold text-[#0f172a]">
                        {editId ? "Edit Contract Data" : "New Contract Setup"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                        {editId ? "Modify existing employment terms" : "Bind a new employment rate or project assignment to a user profile"}
                    </DialogDescription>
                </div>

                {/* Modal Body */}
                <div className="px-6 pt-3.5 pb-4 space-y-3.5 overflow-y-auto flex-1 text-sm">
                    {/* User Selection */}
                    {!editId && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                User <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                value={String(form.user_id || "")} 
                                onValueChange={v => {
                                    setForm({ ...form, user_id: Number(v), project_id: null });
                                }}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10 text-sm">
                                    <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allUsers.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)} className="text-sm">
                                            {u.full_name || u.name} ({u.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Project Selection (Optional) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                            <span>Project Scope (Optional)</span>
                            <span className="text-[10px] text-muted-foreground lowercase font-normal">(leave blank for base rate)</span>
                        </label>
                        <Select 
                            value={form.project_id ? String(form.project_id) : "none"} 
                            onValueChange={v => setForm({ ...form, project_id: v === "none" ? null : Number(v) })}
                            disabled={!form.user_id && !editId}
                        >
                            <SelectTrigger className="bg-white border-slate-200 h-10 text-sm">
                                <SelectValue placeholder={form.user_id ? "Select Project (Optional)" : "Select a user first"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="text-sm font-medium text-slate-700">
                                    General Base Rate (No Project)
                                </SelectItem>
                                {userProjects.length > 0 ? (
                                    userProjects.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)} className="text-sm">
                                            {p.name} {p.client_name ? `(${p.client_name})` : ""}
                                        </SelectItem>
                                    ))
                                ) : (
                                    allProjects.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)} className="text-sm">
                                            {p.name} {p.client_name ? `(${p.client_name})` : ""}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {Boolean(form.user_id && userProjects.length === 0) && (
                            <p className="text-[11px] text-slate-400">
                                Note: This user is not explicitly assigned to any project yet.
                            </p>
                        )}
                    </div>

                    {/* Context Notice / Warning */}
                    {contractNotice && (
                        <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                            contractNotice.type === "warning" 
                                ? "bg-amber-50/80 border-amber-200 text-amber-900" 
                                : "bg-blue-50/80 border-blue-200 text-blue-900"
                        }`}>
                            {contractNotice.type === "warning" ? (
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : (
                                <Info className="h-4 w-4 text-[#2568C1] shrink-0 mt-0.5" />
                            )}
                            <div>
                                <span className="font-bold">{contractNotice.title}: </span>
                                {contractNotice.message}
                            </div>
                        </div>
                    )}

                    {/* Contract Type & Payment Scheme */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                Contract Type <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                value={form.contract_type} 
                                onValueChange={(v: any) => setForm({ ...form, contract_type: v })}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10 text-sm">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="timesheet">Timesheet</SelectItem>
                                    <SelectItem value="mandays">Mandays</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                Payment Scheme <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                value={form.payment_scheme} 
                                onValueChange={(v: any) => setForm({ ...form, payment_scheme: v })}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10 text-sm">
                                    <SelectValue placeholder="Select scheme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="termin">Termin</SelectItem>
                                    <SelectItem value="back_to_back">Back-to-back</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Rate Amount */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            Rate Amount (Rp) <span className="text-red-500">*</span>
                        </label>
                        <CurrencyInput
                            placeholder="e.g. 5.000.000"
                            value={form.rate_amount || ""}
                            onChange={(v: any) => setForm({ ...form, rate_amount: Number(v) || 0 })}
                            disabled={isSaving}
                            className="bg-white border-slate-200 h-10 text-sm"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <CustomDatePicker 
                                date={form.start_date} 
                                onDateChange={(date) => setForm({ ...form, start_date: date })} 
                                disabled={isSaving} 
                                className="h-10 px-3 py-2 text-sm bg-white border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                End Date
                            </label>
                            <CustomDatePicker 
                                date={form.end_date || ""} 
                                onDateChange={(date) => setForm({ ...form, end_date: date })} 
                                disabled={isSaving} 
                                className="h-10 px-3 py-2 text-sm bg-white border-slate-200"
                                placeholder="Optional (Present)"
                            />
                        </div>
                    </div>

                    {/* Active Checkbox if Editing */}
                    {editId && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50">
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-amber-400 accent-amber-600 h-4 w-4" 
                                    checked={form.is_active} 
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })} 
                                />
                                This contract is currently <b>Active</b>
                            </label>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving} className="text-xs font-medium">
                        Cancel
                    </Button>
                    <Button 
                        size="sm"
                        onClick={() => {
                            if ((!editId && !form.user_id) || !form.contract_type || !form.payment_scheme || form.rate_amount === null || form.rate_amount === undefined || form.rate_amount === "" || !form.start_date) {
                                toast.error("Please fill in all required fields");
                                return;
                            }
                            onSave();
                        }} 
                        disabled={isSaving} 
                        className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px] transition-all duration-200 shadow-sm text-xs font-semibold"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save Changes" : "Create Contract"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

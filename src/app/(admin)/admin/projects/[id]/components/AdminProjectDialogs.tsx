"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Trash2, Edit, Save, WalletCards, Calendar, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminProjectDialogsProps {
    state: any;
    actions: any;
}

export function AdminProjectDialogs({ state, actions }: AdminProjectDialogsProps) {
    const { 
        editOpen, assignOpen, resDetailOpen, resCreateOpen, deleteConfirmOpen, zeroConfirmOpen, 
        project, editForm, isSaving, allUsers, selectedRes, resEditMode, resEditForm, resCreateForm 
    } = state;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

    const resStatusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-700",
        approved: "bg-emerald-50 text-emerald-700",
        rejected: "bg-red-50 text-red-700",
    };
    const resStatusDotColors: Record<string, string> = {
        pending: "bg-amber-500",
        approved: "bg-emerald-500",
        rejected: "bg-red-500",
    };

    return (
        <>
            {/* EDIT PROJECT DIALOG */}
            <Dialog open={editOpen} onOpenChange={o => !isSaving && actions.setEditOpen(o)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                        <DialogTitle className="text-lg font-bold text-slate-900">Edit Project Information</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">Update project details and budget thresholds.</DialogDescription>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name <span className="text-red-500">*</span></label>
                                <Input value={editForm.name} onChange={e => actions.setEditForm({ ...editForm, name: e.target.value })} className="h-10 text-sm" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                                <Select value={editForm.status} onValueChange={v => actions.setEditForm({ ...editForm, status: v })} disabled={isSaving}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="on-hold">On Hold</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                                <Input value={editForm.client_name} onChange={e => actions.setEditForm({ ...editForm, client_name: e.target.value })} className="h-10 text-sm" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Email</label>
                                <Input type="email" value={editForm.client_email} onChange={e => actions.setEditForm({ ...editForm, client_email: e.target.value })} className="h-10 text-sm" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Revenue</label>
                                <CurrencyInput value={editForm.budget_revenue || ""} onChange={(v: any) => actions.setEditForm({ ...editForm, budget_revenue: Number(v) || 0 })} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planned Cost (RAB)</label>
                                <CurrencyInput value={editForm.budget_cost || ""} onChange={(v: any) => actions.setEditForm({ ...editForm, budget_cost: Number(v) || 0 })} disabled={isSaving} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Threshold</label>
                                <CurrencyInput value={editForm.budget_cost_threshold || ""} onChange={(v: any) => actions.setEditForm({ ...editForm, budget_cost_threshold: Number(v) || 0 })} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Deadline</label>
                                <CustomDatePicker date={editForm.deadline || ""} onDateChange={(d) => actions.setEditForm({ ...editForm, deadline: d })} disabled={isSaving} className="h-10 text-sm" placeholder="Optional" />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setEditOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={() => {
                            if (!editForm.name?.trim() || !editForm.client_name?.trim()) {
                                toast.error("Please fill in all required fields");
                                return;
                            }
                            actions.handleSaveEditProject();
                        }} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1a4f99] min-w-[120px] font-bold">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE CREATE DIALOG */}
            <Dialog open={resCreateOpen} onOpenChange={actions.setResCreateOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                        <DialogTitle className="text-lg font-bold text-slate-900">Request Resource</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">Submit a new resource request for this project.</DialogDescription>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                            <Select value={resCreateForm.type} onValueChange={v => actions.setResCreateForm({...resCreateForm, type: v})}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select resource type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                    <SelectItem value="accommodation">Accommodation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Details <span className="text-red-500">*</span></label>
                            <Textarea 
                                className="w-full min-h-[120px] p-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-[#2568C1]/20 outline-none" 
                                placeholder="Describe the resource needed..."
                                value={resCreateForm.details} 
                                onChange={e => actions.setResCreateForm({...resCreateForm, details: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setResCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button className="bg-[#2568C1] hover:bg-[#1a4f99] min-w-[120px] font-bold text-white" onClick={() => {
                            if (!resCreateForm.details?.trim()) {
                                toast.error("Please fill in all required fields");
                                return;
                            }
                            actions.handleCreateRes();
                        }} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE DETAIL & EDIT DIALOG */}
            <Dialog open={resDetailOpen} onOpenChange={o => !isSaving && actions.setResDetailOpen(o)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12">
                        <DialogTitle className="text-lg font-bold text-slate-900">Resource Request Details</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">Detailed information and management for this request.</DialogDescription>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {resEditMode ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                    <Select value={resEditForm.type} onValueChange={v => actions.setResEditForm({ ...resEditForm, type: v })} disabled={isSaving}>
                                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manpower">Manpower</SelectItem>
                                            <SelectItem value="tools">Tools</SelectItem>
                                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                            <SelectItem value="accommodation">Accommodation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Details</label>
                                    <Textarea value={resEditForm.details} onChange={e => actions.setResEditForm({ ...resEditForm, details: e.target.value })} className="min-h-[100px] text-sm" disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (Rp)</label>
                                    <CurrencyInput value={resEditForm.amount || ""} onChange={(v: any) => actions.setResEditForm({ ...resEditForm, amount: Number(v) || 0 })} disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                                    <Select value={resEditForm.status} onValueChange={v => actions.setResEditForm({ ...resEditForm, status: v })} disabled={isSaving}>
                                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            selectedRes && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase bg-slate-50 text-slate-500 border-slate-200 px-3 py-1 rounded-full">{selectedRes.type}</Badge>
                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter", resStatusColors[selectedRes.status])}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", resStatusDotColors[selectedRes.status])} />
                                            {selectedRes.status}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</p>
                                        <p className="text-sm text-slate-700 font-bold bg-slate-50 p-4 rounded-md border border-slate-100 whitespace-pre-wrap leading-relaxed">{selectedRes.details}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</p>
                                            <p className="text-sm font-black text-slate-800">{selectedRes.user?.full_name || `User #${selectedRes.user_id}`}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                                            <p className="text-sm font-black text-[#2568C1]">{formatCurrency(selectedRes.amount || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between gap-3">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold" onClick={() => actions.setDeleteConfirmOpen(true)} disabled={isSaving}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                        <div className="flex gap-2">
                            {resEditMode ? (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => actions.setResEditMode(false)} disabled={isSaving}>Cancel</Button>
                                    <Button size="sm" className="bg-[#2568C1] hover:bg-[#1a4f99] font-bold min-w-[100px]" onClick={() => actions.handleSaveResEdit()} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" size="sm" className="gap-2 font-bold" onClick={() => actions.setResEditMode(true)}>
                                    <Edit className="h-3.5 w-3.5" /> Edit Request
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ASSIGN MEMBER DIALOG */}
            <Dialog open={assignOpen} onOpenChange={o => !isSaving && actions.setAssignOpen(o)}>
                <DialogContent className="sm:max-w-[460px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md">
                    {/* Modal Header */}
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 shrink-0">
                        <DialogTitle className="text-lg font-bold text-[#0f172a]">
                            Assign Member
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">
                            Add a new user to this project and define their rate.
                        </DialogDescription>
                    </div>

                    {/* Modal Body */}
                    <div className="px-6 pt-3.5 pb-4 space-y-3.5 overflow-y-auto flex-1 text-sm">
                        {/* User Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                User <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                value={String(state.assignForm.user_id || "")} 
                                onValueChange={v => actions.handleMemberUserSelect(Number(v))} 
                                disabled={isSaving}
                            >
                                <SelectTrigger className="bg-white border-slate-200 h-10 text-sm">
                                    <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allUsers
                                        .filter((u: any) => 
                                            (u.role === "projectmanager" || u.role === "employee") &&
                                            !state.members.find((m: any) => m.user_id === Number(u.id))
                                        )
                                        .map((u: any) => (
                                            <SelectItem key={u.id} value={String(u.id)} className="text-sm">
                                                {u.full_name || u.name} ({u.role === "projectmanager" ? "Project Manager" : "Employee"})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Role in Project */}
                        {state.assignForm.user_id > 0 && (() => {
                            const selectedUser = allUsers.find((u: any) => Number(u.id) === Number(state.assignForm.user_id));
                            const isSystemPM = selectedUser?.role === "projectmanager";

                            if (isSystemPM) {
                                const isPMSelected = state.assignForm.role_in_project === "Project Manager";
                                return (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Role in Project <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div
                                                onClick={() => !isSaving && actions.setAssignForm({ ...state.assignForm, role_in_project: "Project Manager" })}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    isPMSelected 
                                                        ? "border-[#2568C1] bg-blue-50/50 shadow-sm" 
                                                        : "border-slate-200 hover:bg-slate-50/80 bg-white"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="pm_role_choice"
                                                    checked={isPMSelected}
                                                    onChange={() => actions.setAssignForm({ ...state.assignForm, role_in_project: "Project Manager" })}
                                                    disabled={isSaving}
                                                    className="text-[#2568C1] focus:ring-[#2568C1] cursor-pointer h-4 w-4"
                                                />
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-semibold ${isPMSelected ? "text-[#2568C1]" : "text-slate-700"}`}>
                                                        Project Manager
                                                    </span>
                                                    <span className="text-xs text-slate-400 mt-0.5">Lead this project</span>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => {
                                                    if (!isSaving && isPMSelected) {
                                                        actions.setAssignForm({ ...state.assignForm, role_in_project: "" });
                                                    }
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                    !isPMSelected 
                                                        ? "border-[#2568C1] bg-blue-50/50 shadow-sm" 
                                                        : "border-slate-200 hover:bg-slate-50/80 bg-white"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="pm_role_choice"
                                                    checked={!isPMSelected}
                                                    onChange={() => actions.setAssignForm({ ...state.assignForm, role_in_project: "" })}
                                                    disabled={isSaving}
                                                    className="text-[#2568C1] focus:ring-[#2568C1] cursor-pointer h-4 w-4"
                                                />
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-semibold ${!isPMSelected ? "text-[#2568C1]" : "text-slate-700"}`}>
                                                        Other Role
                                                    </span>
                                                    <span className="text-xs text-slate-400 mt-0.5">Custom team role</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isPMSelected && (
                                            <div className="pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Input 
                                                    placeholder="Enter custom role (e.g. Technical Advisor, Co-Lead)..." 
                                                    value={state.assignForm.role_in_project} 
                                                    onChange={e => actions.setAssignForm({ ...state.assignForm, role_in_project: e.target.value })} 
                                                    className="bg-white border-slate-200 h-10 text-sm" 
                                                    disabled={isSaving}
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Non-PM user: Standard input
                            return (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Role in Project <span className="text-red-500">*</span>
                                    </label>
                                    <Input 
                                        placeholder="e.g. Backend Dev, Designer, QA..." 
                                        value={state.assignForm.role_in_project} 
                                        onChange={e => actions.setAssignForm({ ...state.assignForm, role_in_project: e.target.value })} 
                                        className="bg-white border-slate-200 h-10 text-sm" 
                                        disabled={isSaving} 
                                    />
                                </div>
                            );
                        })()}

                        {/* Contract / Rate Plan */}
                        {state.assignForm.user_id > 0 && (
                            <div className="space-y-3.5 pt-2 border-t border-slate-100 animate-in fade-in duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Contract / Rate Plan
                                    </label>
                                    {state.memberLoadingContracts ? (
                                        <div className="flex items-center gap-2 h-10 text-xs text-slate-400">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#2568C1]" /> Loading contracts...
                                        </div>
                                    ) : (
                                        <Select 
                                            value={state.memberSelectedContractId} 
                                            onValueChange={actions.handleMemberContractSelect} 
                                            disabled={isSaving}
                                        >
                                            <SelectTrigger className="bg-white border-slate-200 h-10 text-sm">
                                                <SelectValue placeholder="Select plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {state.memberUserContracts.map((c: any) => (
                                                    <SelectItem key={c.id} value={String(c.id)} className="text-sm">
                                                        {`${c.contract_type} - Rp ${c.rate_amount.toLocaleString()} (${c.payment_scheme})`}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="custom" className="text-sm">Custom Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {state.memberAssignRateMode === "custom" && (
                                    <div className="space-y-3.5 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                    Contract Type <span className="text-red-500">*</span>
                                                </label>
                                                <Select 
                                                    value={state.assignForm.contract_type || ""} 
                                                    onValueChange={v => actions.setAssignForm({ ...state.assignForm, contract_type: v })} 
                                                    disabled={isSaving}
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
                                                    value={state.assignForm.payment_scheme || ""} 
                                                    onValueChange={v => actions.setAssignForm({ ...state.assignForm, payment_scheme: v })} 
                                                    disabled={isSaving}
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
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Rate Amount (Rp) <span className="text-red-500">*</span>
                                            </label>
                                            <CurrencyInput 
                                                placeholder="e.g. 5.000.000" 
                                                value={state.assignForm.custom_rate || ""} 
                                                onChange={(v: any) => actions.setAssignForm({ ...state.assignForm, custom_rate: Number(v) || null })} 
                                                disabled={isSaving}
                                                className="bg-white border-slate-200 h-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3 shrink-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => actions.setAssignOpen(false)} 
                            disabled={isSaving} 
                            className="text-[#64748b]"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => {
                                if (!state.assignForm.user_id || !state.assignForm.role_in_project?.trim()) {
                                    toast.error("Please fill in all required fields");
                                    return;
                                }
                                actions.handleAssignSave();
                            }} 
                            disabled={isSaving} 
                            className="bg-[#2568C1] hover:bg-[#1e56a6] shadow-md shadow-[#2568C1]/20 min-w-[120px]"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm Assign"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DELETE RESOURCE CONFIRMATION */}
            <Dialog open={deleteConfirmOpen} onOpenChange={actions.setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                    <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-[#0f172a]">Delete Resource Request?</DialogTitle>
                            <p className="text-xs text-red-600/80">Permanent action</p>
                        </div>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to delete this resource request? This action cannot be undone.
                    </div>
                    <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                        <Button variant="outline" className="rounded-md" onClick={() => actions.setDeleteConfirmOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button variant="destructive" className="rounded-md min-w-[110px]" onClick={actions.handleDeleteRes} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ZERO AMOUNT CONFIRMATION */}
            <Dialog open={zeroConfirmOpen} onOpenChange={actions.setZeroConfirmOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                    <div className="bg-amber-50/60 border-b border-amber-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-amber-200 text-amber-600">
                            <WalletCards className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold text-[#0f172a]">Confirm Zero Amount</DialogTitle>
                            <p className="text-xs text-amber-600/80">Action confirmation</p>
                        </div>
                    </div>
                    <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                        You are setting the amount to 0 for a non-manpower resource. Proceed?
                    </div>
                    <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                        <Button variant="outline" className="rounded-md" onClick={() => actions.setZeroConfirmOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button className="rounded-md bg-amber-600 hover:bg-amber-700 text-white min-w-[110px]" onClick={() => actions.handleSaveResEdit(true)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Save"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

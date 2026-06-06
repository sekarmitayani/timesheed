"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Trash2, Edit, Save, WalletCards, Calendar, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

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
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Edit Project Information</DialogTitle>
                        <DialogDescription className="text-xs">Update project details and budget thresholds.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name *</label>
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
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name *</label>
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
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Threshold</label>
                            <CurrencyInput value={editForm.budget_cost_threshold || ""} onChange={(v: any) => actions.setEditForm({ ...editForm, budget_cost_threshold: Number(v) || 0 })} disabled={isSaving} />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setEditOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={actions.handleSaveEditProject} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1a4f99] min-w-[120px] font-bold">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE CREATE DIALOG */}
            <Dialog open={resCreateOpen} onOpenChange={actions.setResCreateOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Request Resource</DialogTitle>
                        <DialogDescription className="text-xs">Submit a new resource request for this project.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
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
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Details *</label>
                            <Textarea 
                                className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#2568C1]/20 outline-none" 
                                placeholder="Describe the resource needed..."
                                value={resCreateForm.details} 
                                onChange={e => actions.setResCreateForm({...resCreateForm, details: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => actions.setResCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button className="flex-1 bg-[#2568C1] hover:bg-[#1a4f99] font-bold" onClick={actions.handleCreateRes} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESOURCE DETAIL & EDIT DIALOG */}
            <Dialog open={resDetailOpen} onOpenChange={o => !isSaving && actions.setResDetailOpen(o)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Resource Request Details</DialogTitle>
                        <DialogDescription className="text-xs">Detailed information and management for this request.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
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
                                        <p className="text-sm text-slate-700 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">{selectedRes.details}</p>
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
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">Assign Member</DialogTitle>
                        <DialogDescription className="text-xs">Add a new user to this project and define their rate.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select User *</label>
                            <Select value={String(state.assignForm.user_id || "")} onValueChange={v => actions.handleMemberUserSelect(Number(v))} disabled={isSaving}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Choose a user" /></SelectTrigger>
                                <SelectContent>
                                    {allUsers.filter((u: any) => !state.members.find((m: any) => m.user_id === Number(u.id))).map((u: any) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Role in Project *</label>
                            <Input placeholder="e.g. Backend Dev" value={state.assignForm.role_in_project} onChange={e => actions.setAssignForm({ ...state.assignForm, role_in_project: e.target.value })} className="h-10 text-sm" disabled={isSaving} />
                        </div>

                        {state.assignForm.user_id > 0 && (
                            <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contract / Rate Plan</label>
                                    {state.memberLoadingContracts ? (
                                        <div className="flex items-center gap-2 h-10 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</div>
                                    ) : (
                                        <Select value={state.memberSelectedContractId} onValueChange={actions.handleMemberContractSelect} disabled={isSaving}>
                                            <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select plan" /></SelectTrigger>
                                            <SelectContent>
                                                {state.memberUserContracts.map((c: any) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{`${c.contract_type} - Rp ${c.rate_amount.toLocaleString()} (${c.payment_scheme})`}</SelectItem>
                                                ))}
                                                <SelectItem value="custom">Custom Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {state.memberAssignRateMode === "custom" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Rate (Rp)</label>
                                            <CurrencyInput className="h-10 bg-white" placeholder="0" value={state.assignForm.custom_rate || ""} onChange={(v: any) => actions.setAssignForm({ ...state.assignForm, custom_rate: Number(v) || null })} disabled={isSaving} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Type</label>
                                            <Select value={state.assignForm.contract_type || ""} onValueChange={v => actions.setAssignForm({ ...state.assignForm, contract_type: v })} disabled={isSaving}>
                                                <SelectTrigger className="h-10 bg-white text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="hourly">Hourly</SelectItem>
                                                    <SelectItem value="mandays">Mandays</SelectItem>
                                                    <SelectItem value="termin">Termin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-500">Scheme</label>
                                            <Select value={state.assignForm.payment_scheme || ""} onValueChange={v => actions.setAssignForm({ ...state.assignForm, payment_scheme: v })} disabled={isSaving}>
                                                <SelectTrigger className="h-10 bg-white text-sm"><SelectValue placeholder="Scheme" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="termin">Termin</SelectItem>
                                                    <SelectItem value="back_to_back">Back-to-back</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setAssignOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={actions.handleAssignSave} disabled={isSaving} className="bg-[#0f172a] hover:bg-slate-800 text-white min-w-[120px] font-bold">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assign"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DELETE RESOURCE CONFIRMATION */}
            <Dialog open={deleteConfirmOpen} onOpenChange={actions.setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <div className="pt-4 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><WalletCards className="h-6 w-6" /></div>
                        <DialogTitle className="text-xl font-bold text-slate-900">Confirm Delete</DialogTitle>
                        <DialogDescription className="mt-2 text-slate-500">Are you sure you want to delete this resource request? This action cannot be undone.</DialogDescription>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => actions.setDeleteConfirmOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button variant="destructive" className="flex-1 font-bold" onClick={actions.handleDeleteRes} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ZERO AMOUNT CONFIRMATION */}
            <Dialog open={zeroConfirmOpen} onOpenChange={actions.setZeroConfirmOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <div className="pt-4 text-center">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><WalletCards className="h-6 w-6" /></div>
                        <DialogTitle className="text-xl font-bold text-slate-900">Confirm Zero Amount</DialogTitle>
                        <DialogDescription className="mt-2 text-slate-500">You are setting the amount to 0 for a non-manpower resource. Proceed?</DialogDescription>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => actions.setZeroConfirmOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={() => actions.handleSaveResEdit(true)} disabled={isSaving}>Confirm & Save</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, UserPlus, X, Trash2, Crown, Check } from "lucide-react";
import { useState } from "react";
import { adminContractService } from "@/lib/services/admin-contracts";
import { toast } from "sonner";

interface AdminProjectMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any;
    members: any[];
    isLoading: boolean;
    isSaving: boolean;
    allUsers: any[];
    onAssign: (payload: any) => void;
    onRemove: (id: number) => void;
}

export function AdminProjectMembersDialog({
    open, onOpenChange, project, members, isLoading, isSaving, allUsers, onAssign, onRemove
}: AdminProjectMembersDialogProps) {
    
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [assignForm, setAssignForm] = useState({
        user_id: 0, role_in_project: "", custom_rate: null as number | null, 
        contract_type: "", payment_scheme: ""
    });
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [userContracts, setUserContracts] = useState<any[]>([]);
    const [assignRateMode, setAssignRateMode] = useState<"contract" | "custom">("contract");
    const [selectedContractId, setSelectedContractId] = useState("");

    const handleUserSelect = async (uid: number) => {
        setAssignForm({ ...assignForm, user_id: uid, custom_rate: null, contract_type: "", payment_scheme: "" });
        setSelectedContractId("");
        setAssignRateMode("contract");
        if (uid) {
            setLoadingContracts(true);
            try {
                const allC = await adminContractService.getUserContracts(uid);
                const c = allC.filter(x => !x.project_id);
                setUserContracts(c);
                if (c.length === 0) setAssignRateMode("custom");
            } catch {
                setUserContracts([]);
                setAssignRateMode("custom");
            } finally {
                setLoadingContracts(false);
            }
        }
    };

    const handleContractSelect = (v: string) => {
        if (v === "custom") {
            setAssignRateMode("custom");
            setSelectedContractId("custom");
            setAssignForm({ ...assignForm, custom_rate: null, contract_type: "", payment_scheme: "" });
        } else {
            setAssignRateMode("contract");
            setSelectedContractId(v);
            const c = userContracts.find(x => String(x.id) === v);
            if (c) setAssignForm({ ...assignForm, custom_rate: c.rate_amount, contract_type: c.contract_type, payment_scheme: c.payment_scheme });
        }
    };

    const handleSave = () => {
        if (!assignForm.user_id || !assignForm.role_in_project) { toast.error("User and role required"); return; }
        const p: any = { 
            project_id: project.id, 
            user_id: Number(assignForm.user_id), 
            role_in_project: assignForm.role_in_project 
        };
        if (assignRateMode === "custom" && assignForm.custom_rate) {
            p.custom_rate = Number(assignForm.custom_rate); p.contract_type = assignForm.contract_type || "termin"; p.payment_scheme = assignForm.payment_scheme || "monthly";
        } else if (assignRateMode === "contract" && selectedContractId !== "custom") {
            const c = userContracts.find(x => String(x.id) === selectedContractId);
            if (c) { p.custom_rate = c.rate_amount; p.contract_type = c.contract_type; p.payment_scheme = c.payment_scheme; }
        }
        onAssign(p);
        setShowAssignForm(false);
        setAssignForm({ user_id: 0, role_in_project: "", custom_rate: null, contract_type: "", payment_scheme: "" });
    };

    const getInitials = (name: string) => (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

    return (
        <Dialog open={open} onOpenChange={o => !isSaving && onOpenChange(o)}>
            <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] p-0 overflow-hidden border-[#e2e8f0] flex flex-col">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <DialogTitle className="text-lg text-[#0f172a] font-bold">Team Management</DialogTitle>
                        <DialogDescription className="text-xs">{project?.name} • {members.length} members</DialogDescription>
                    </div>
                    {!showAssignForm && <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9 px-4 border-[#2568C1] text-[#2568C1] hover:bg-[#2568C1]/10" onClick={() => setShowAssignForm(true)}><UserPlus className="h-4 w-4" /> Add Member</Button>}
                </div>
                
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {showAssignForm && (
                        <div className="border border-[#2568C1]/20 bg-[#2568C1]/5 rounded-xl p-5 m-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between border-b border-[#2568C1]/10 pb-2 mb-2">
                                <h4 className="text-sm font-bold text-[#2568C1]">Assign New Member</h4>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setShowAssignForm(false)}><X className="h-4 w-4" /></Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-500">User *</label>
                                    <Select value={String(assignForm.user_id || "")} onValueChange={v => handleUserSelect(Number(v))}>
                                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Choose" /></SelectTrigger>
                                        <SelectContent>{allUsers.filter(u => !members.find(m => m.user_id === Number(u.id))).map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-500">Role *</label>
                                    <Input className="h-9 bg-white" placeholder="e.g. Backend Dev" value={assignForm.role_in_project} onChange={e => setAssignForm({ ...assignForm, role_in_project: e.target.value })} />
                                </div>
                            </div>
                            {assignForm.user_id > 0 && (
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-500">Rate Plan</label>
                                    {loadingContracts ? <div className="flex items-center gap-2 h-9 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> Fetching contracts...</div> : 
                                        <Select value={selectedContractId} onValueChange={handleContractSelect}>
                                            <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Select plan" /></SelectTrigger>
                                            <SelectContent>{userContracts.map(c => <SelectItem key={c.id} value={String(c.id)}>{`${c.contract_type} - Rp ${c.rate_amount.toLocaleString()} (${c.payment_scheme})`}</SelectItem>)}<SelectItem value="custom">Custom Rate</SelectItem></SelectContent>
                                        </Select>}
                                    {assignRateMode === "custom" && (
                                        <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-300">
                                            <CurrencyInput className="h-9 bg-white" value={assignForm.custom_rate || ""} onChange={(v: any) => setAssignForm({ ...assignForm, custom_rate: Number(v) || null })} />
                                            <Select value={assignForm.contract_type} onValueChange={v => setAssignForm({...assignForm, contract_type: v})}><SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="termin">Termin</SelectItem></SelectContent></Select>
                                            <Select value={assignForm.payment_scheme} onValueChange={v => setAssignForm({...assignForm, payment_scheme: v})}><SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Scheme" /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="back_to_back">B2B</SelectItem></SelectContent></Select>
                                        </div>
                                    )}
                                </div>
                            )}
                            <Button className="w-full h-9 bg-[#2568C1] hover:bg-[#1a4f99] font-bold" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}</Button>
                        </div>
                    )}

                    <div className="px-5 py-2 space-y-2">
                        {isLoading ? <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#2568C1]/40" /></div> : 
                         members.length === 0 ? <div className="py-12 text-center text-sm text-slate-400 font-medium">No members assigned yet.</div> : 
                         members.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                                        <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                            {getInitials(m.user?.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{m.user?.full_name || `User #${m.user_id}`}</div>
                                        <div className="text-[10px] font-medium text-slate-400">{m.user?.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={`text-[10px] font-bold px-2 py-0.5 border-none shadow-none ${m.role_in_project === "Project Manager" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{m.role_in_project === "Project Manager" && <Crown className="h-3 w-3 mr-1" />}{m.role_in_project}</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => onRemove(m.id)} disabled={isSaving}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

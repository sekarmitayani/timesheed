"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Loader2, Check, ArrowRight, ArrowLeft, Save, UserPlus, Trash2 } from "lucide-react";
import { adminContractService } from "@/lib/services/admin-contracts";
import { useState } from "react";
import { toast } from "sonner";

interface AdminProjectWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: number;
    setStep: (step: number) => void;
    isSaving: boolean;
    form: any;
    setForm: (f: any) => void;
    selectedPmId: string;
    setSelectedPmId: (id: string) => void;
    pendingEmployees: any[];
    setPendingEmployees: (e: any[]) => void;
    allUsers: any[];
    onSave: () => void;
}

export function AdminProjectWizard({
    open, onOpenChange, step, setStep, isSaving,
    form, setForm, selectedPmId, setSelectedPmId,
    pendingEmployees, setPendingEmployees, allUsers, onSave
}: AdminProjectWizardProps) {
    
    const [empForm, setEmpForm] = useState({
        userId: "", role: "", rateMode: "contract" as "contract" | "custom",
        selectedContractId: "", customRate: null as number | null,
        contractType: "", paymentScheme: "", startDate: new Date().toISOString()
    });
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);
    const [empContracts, setEmpContracts] = useState<any[]>([]);

    const stepLabels = ["Project Info", "Assign PM", "Assign Employees"];
    const pmUsers = allUsers.filter(u => u.role === "projectmanager");
    const availableEmployees = allUsers.filter(u => 
        (u.role === "employee" || u.role === "projectmanager") &&
        String(u.id) !== selectedPmId && 
        !pendingEmployees.find(e => String(e.user.id) === String(u.id))
    );

    const handleUserSelect = async (uid: string) => {
        setEmpForm({ ...empForm, userId: uid, selectedContractId: "", rateMode: "contract", customRate: null, contractType: "", paymentScheme: "", startDate: new Date().toISOString() });
        if (uid) {
            setIsLoadingContracts(true);
            try {
                const allC = await adminContractService.getUserContracts(Number(uid));
                const c = allC.filter(x => !x.project_id);
                setEmpContracts(c);
                if (c.length === 0) setEmpForm(prev => ({ ...prev, rateMode: "custom" }));
            } catch {
                setEmpContracts([]);
                setEmpForm(prev => ({ ...prev, rateMode: "custom" }));
            } finally {
                setIsLoadingContracts(false);
            }
        }
    };

    const addEmployee = () => {
        if (!empForm.userId || !empForm.role) { toast.error("Select user and enter role"); return; }
        const u = allUsers.find(x => String(x.id) === empForm.userId);
        if (!u) return;
        setPendingEmployees([...pendingEmployees, { 
            user: u, 
            role_in_project: empForm.role, 
            rateMode: empForm.rateMode, 
            selectedContractId: empForm.selectedContractId, 
            custom_rate: empForm.customRate, 
            contract_type: empForm.contractType, 
            payment_scheme: empForm.paymentScheme,
            start_date: empForm.startDate
        }]);
        setEmpForm({ userId: "", role: "", rateMode: "contract", selectedContractId: "", customRate: null, contractType: "", paymentScheme: "", startDate: new Date().toISOString() });
    };

    return (
        <Dialog open={open} onOpenChange={o => !isSaving && onOpenChange(o)}>
            <DialogContent className="sm:max-w-[650px] max-w-[95vw] p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 flex flex-col gap-1">
                    <DialogTitle className="text-base text-[#0f172a] font-bold">Create New Project</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">{`Step ${step} of 3 - ${stepLabels[step - 1]}`}</DialogDescription>
                </div>
                
                {/* Progress Bar */}
                <div className="px-6 pt-3.5 pb-2 flex items-center gap-2">
                    {stepLabels.map((label, i) => (
                        <div key={i} className="flex items-center gap-2 flex-1">
                            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${i + 1 < step ? "bg-emerald-500 text-white" : i + 1 === step ? "bg-[#2568C1] text-white shadow-md shadow-[#2568C1]/20" : "bg-slate-100 text-slate-400"}`}>
                                {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:inline ${i + 1 === step ? "text-[#0f172a]" : "text-slate-400"}`}>{label}</span>
                            {i < 2 && <div className="flex-1 h-[2px] bg-slate-100"><div className={`h-full bg-[#2568C1] transition-all duration-500 ${i + 1 < step ? "w-full" : "w-0"}`} /></div>}
                        </div>
                    ))}
                </div>

                <div className="px-6 pt-2 pb-5 space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#0f172a]">Project Name <span className="text-red-500">*</span></label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Website Revamp" disabled={isSaving} className="h-10 rounded-md" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Client Name <span className="text-red-500">*</span></label>
                                    <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="PT ABC" disabled={isSaving} className="h-10" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Client Email</label>
                                    <Input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="abc@example.com" disabled={isSaving} className="h-10" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Budget Revenue (Rp)</label>
                                    <CurrencyInput value={form.budget_revenue || ""} onChange={(v: any) => setForm({ ...form, budget_revenue: Number(v) || 0 })} disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Planned Cost / RAB (Rp)</label>
                                    <CurrencyInput value={form.budget_cost || ""} onChange={(v: any) => setForm({ ...form, budget_cost: Number(v) || 0 })} disabled={isSaving} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cost Threshold (Rp)</label>
                                    <CurrencyInput value={form.budget_cost_threshold || ""} onChange={(v: any) => setForm({ ...form, budget_cost_threshold: Number(v) || 0 })} disabled={isSaving} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Deadline</label>
                                    <CustomDatePicker date={form.deadline || ""} onDateChange={(d) => setForm({ ...form, deadline: d })} disabled={isSaving} className="h-10 text-sm" placeholder="Optional" />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Project Manager <span className="text-red-500">*</span></label>
                                <Select value={selectedPmId} onValueChange={setSelectedPmId}>
                                    <SelectTrigger className="h-10"><SelectValue placeholder="Choose a PM" /></SelectTrigger>
                                    <SelectContent>{pmUsers.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            {selectedPmId && (() => {
                                const pm = pmUsers.find(u => String(u.id) === selectedPmId);
                                return pm ? (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                {(pm.full_name || "?").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-bold text-[#2568C1]">{pm.full_name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Manager</div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Add Employee</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">User</label>
                                        <Select value={empForm.userId} onValueChange={handleUserSelect}>
                                            <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                {availableEmployees.map(u => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.full_name || u.name} ({u.role === "projectmanager" ? "Project Manager" : "Employee"})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                                        <Input className="h-9 bg-white" placeholder="Backend Dev" value={empForm.role} onChange={e => setEmpForm({ ...empForm, role: e.target.value })} />
                                    </div>
                                </div>
                                {empForm.userId && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contract / Rate</label>
                                        {isLoadingContracts ? <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</div> : 
                                            <Select value={empForm.selectedContractId} onValueChange={v => setEmpForm({...empForm, selectedContractId: v})}>
                                                <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{empContracts.map(c => <SelectItem key={c.id} value={String(c.id)}>{`${c.contract_type} - Rp ${c.rate_amount.toLocaleString()} (${c.payment_scheme})`}</SelectItem>)}<SelectItem value="custom">Custom Rate</SelectItem></SelectContent>
                                            </Select>}
                                            
                                        {empForm.selectedContractId === "custom" && (
                                            <div className="pt-2 space-y-3 animate-in fade-in duration-300 border border-slate-100 rounded-lg p-3 bg-white">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Rate Amount</label>
                                                        <CurrencyInput className="h-9" value={empForm.customRate || ""} onChange={(v: any) => setEmpForm({ ...empForm, customRate: Number(v) || null })} />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contract Type</label>
                                                        <Select value={empForm.contractType} onValueChange={v => setEmpForm({...empForm, contractType: v})}>
                                                            <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Select Type" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="timesheet">Timesheet</SelectItem>
                                                                <SelectItem value="mandays">Mandays</SelectItem>
                                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                                <SelectItem value="yearly">Yearly</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Scheme</label>
                                                        <Select value={empForm.paymentScheme} onValueChange={v => setEmpForm({...empForm, paymentScheme: v})}>
                                                            <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Select Scheme" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                                <SelectItem value="back_to_back">Back-to-Back</SelectItem>
                                                                <SelectItem value="per_project">Per-Project</SelectItem>
                                                                <SelectItem value="daily">Daily</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                                                        <CustomDatePicker date={empForm.startDate || ""} onDateChange={(d) => setEmpForm({ ...empForm, startDate: d })} className="h-9 text-xs" />
                                                    </div>
                                                </div>
                                                <div className="bg-amber-50 text-amber-700 text-[10px] p-2 rounded border border-amber-100 flex gap-2 items-start leading-tight">
                                                    <div className="font-bold mt-0.5">Note:</div>
                                                    <div>This contract will automatically deactivate (auto-off) when the project is marked as Completed or Cancelled.</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Button size="sm" className="w-full bg-[#0f172a] hover:bg-slate-800 h-9" onClick={addEmployee} disabled={!empForm.userId || !empForm.role}>
                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add to List
                                </Button>
                            </div>

                            {pendingEmployees.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Assigned ({pendingEmployees.length})</h4>
                                    {pendingEmployees.map((emp, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                        {(emp.user.full_name || "?").substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{emp.user.full_name || emp.user.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-400">{emp.role_in_project}</div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => setPendingEmployees(pendingEmployees.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={isSaving} className="gap-1.5 rounded-md">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-2">
                        {step === 1 && (
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-md">
                                Cancel
                            </Button>
                        )}
                        {step < 3 ? 
                            <Button 
                                onClick={() => {
                                    if (step === 1) {
                                        if (!form.name?.trim() || !form.client_name?.trim()) {
                                            toast.error("Please fill in all required fields");
                                            return;
                                        }
                                    }
                                    if (step === 2) {
                                        if (!selectedPmId) {
                                            toast.error("Please select a Project Manager");
                                            return;
                                        }
                                    }
                                    setStep(step + 1);
                                }} 
                                className="gap-1.5 bg-[#2568C1] hover:bg-[#1a4f99] min-w-[120px] rounded-md"
                            >
                                Next <ArrowRight className="h-4 w-4" />
                            </Button> :
                            <Button onClick={onSave} disabled={isSaving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 min-w-[160px] rounded-md">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Create Project</>}
                            </Button>
                        }
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

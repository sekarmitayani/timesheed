import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Phone, Briefcase, Calendar, Plus, Trash2, Edit, FolderKanban, Star } from "lucide-react";
import { User, ApiProject } from "@/lib/types";
import { Contract, CreateContractPayload } from "@/lib/services/admin-contracts";

interface UserDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    contracts: Contract[];
    projects: ApiProject[];
    isLoadingDetails: boolean;
    isSavingContract: boolean;
    isContractEditorOpen: boolean;
    editingContractId: number | null;
    contractForm: CreateContractPayload & { is_active: boolean, rate_display?: string };
    setContractForm: (v: any) => void;
    setIsContractEditorOpen: (v: boolean) => void;
    onEditContract: (c: Contract) => void;
    onSaveContract: () => void;
    onDeleteContract: (id: number) => void;
    onResetContractForm: () => void;
}

const fmtDate = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "-" : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

export function UserDetailsDialog({
    open, onOpenChange, user, contracts, projects,
    isLoadingDetails, isSavingContract, isContractEditorOpen,
    editingContractId, contractForm, setContractForm,
    setIsContractEditorOpen, onEditContract, onSaveContract,
    onDeleteContract, onResetContractForm
}: UserDetailsDialogProps) {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={(open) => !isSavingContract && onOpenChange(open)}>
            <DialogContent className="sm:max-w-[1100px] w-[95vw] p-0 overflow-hidden border-[#e2e8f0] bg-white">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                        <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                            {user.name?.split(" ").slice(0, 2).map(n => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <DialogTitle className="text-xl text-[#0f172a]">{user.name}</DialogTitle>
                        <div className="text-sm flex gap-2 items-center mt-1">
                            <span className="capitalize text-muted-foreground font-medium">{user.role === "projectmanager" ? "Project Manager" : user.role === "finance" ? "Management" : user.role}</span>
                            •
                            <Badge variant="outline" className="text-[10px] font-bold tracking-wider py-0.5 rounded-full bg-emerald-50 text-emerald-600 border-none px-2.5 capitalize">{user.status === "active" ? "Active" : "Inactive"}</Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[70vh] md:h-auto md:max-h-[75vh] overflow-y-auto">
                    <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-6 space-y-6">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Profile Information</h4>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div className="min-w-0">
                                    <div className="text-[11px] text-slate-500 font-medium">Email Address</div>
                                    <div className="text-sm text-slate-800 truncate">{user.email}</div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-[11px] text-slate-500 font-medium">Phone Number</div>
                                    <div className="text-sm text-slate-800">{user.phone_number || "-"}</div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-[11px] text-slate-500 font-medium">Employee Base Type</div>
                                    <div className="text-sm text-slate-800 capitalize">{user.employee_type || "System Default"}</div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Star className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-[11px] text-slate-500 font-medium">Skill Level</div>
                                    <div className="text-sm text-slate-800 capitalize">
                                        {(user as any).skill_level === 1 ? "Junior" : 
                                         (user as any).skill_level === 2 ? "Mid-Level" : 
                                         (user as any).skill_level === 3 ? "Senior" : "Not Set"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <div className="text-[11px] text-slate-500 font-medium">Account Created</div>
                                    <div className="text-sm text-slate-800">{fmtDate(user.joinDate)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-8 bg-white flex flex-col h-full max-h-[75vh]">
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {isLoadingDetails ? (
                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" />
                                    <p className="text-sm">Loading Assignment Data...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-[#e2e8f0]">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-[#2568C1]" /> General Contracts (Default Rates)
                                            </h4>
                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-[#2568C1] text-[#2568C1] hover:bg-blue-50" onClick={() => { onResetContractForm(); setIsContractEditorOpen(true); }}>
                                                <Plus className="h-3.5 w-3.5" /> Add Base Rate
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {contracts.filter(c => !c.project_id).length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-4 w-full col-span-2 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
                                                    No general base contracts found. Employee uses default or project-specific rates.
                                                </p>
                                            ) : (
                                                contracts.filter(c => !c.project_id).map((c) => (
                                                    <Card key={c.id} className={`p-4 space-y-3 cursor-pointer transition-all border-l-4 ${c.is_active ? 'border-l-[#2568C1] border-y-[#e2e8f0] border-r-[#e2e8f0] shadow-sm hover:shadow-md' : 'border-l-slate-300 border-y-[#e2e8f0] border-r-[#e2e8f0] opacity-80'}`} onClick={() => onEditContract(c)}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col gap-1">
                                                                <Badge variant="outline" className={`capitalize text-[10px] w-fit font-bold rounded-full px-2.5 py-0.5 border-none ${c.is_active ? 'bg-blue-50 text-[#2568C1]' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {c.contract_type} Rate
                                                                </Badge>
                                                                <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">Payment: {c.payment_scheme}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                                {c.is_active ? <span className="h-2 w-2 rounded-full bg-[#4B7BEC] animate-pulse" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">{c.is_active ? 'Active' : 'Ended'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-base font-extrabold text-[#0f172a] flex items-center justify-between mt-2">
                                                            <span className="bg-slate-50 py-1 px-2 rounded border border-slate-100 font-mono text-sm tracking-tight text-[#1e293b]">Rp {(c.rate_amount || 0).toLocaleString('id-ID')}</span>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDeleteContract(c.id); }} disabled={isSavingContract}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{fmtDate(c.start_date)} &rarr; {c.end_date ? fmtDate(c.end_date) : 'Present'}</span>
                                                        </div>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 mt-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-[#e2e8f0]">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4 text-emerald-600" /> Project History & Assignments
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {(() => {
                                                const pIds = [...new Set(contracts.filter(c => c.project_id).map(c => c.project_id))];
                                                if (pIds.length === 0) return <div className="text-center py-6 border border-slate-200 border-dashed rounded-xl bg-slate-50">No project assignments linked to explicit rates.</div>;
                                                return pIds.map(pid => {
                                                    const pData = projects.find(p => p.id === pid);
                                                    const pContracts = contracts.filter(c => c.project_id === pid);
                                                    return (
                                                        <div key={pid} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                                                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                                                <div>
                                                                    <div className="font-semibold text-sm text-slate-800">{pData?.name || `Project #${pid}`}</div>
                                                                    <div className="text-[10px] text-slate-500">{pData?.client_name || "Unknown Client"}</div>
                                                                </div>
                                                                <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border-none ${pData?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{pData?.status || "historical"}</Badge>
                                                            </div>
                                                            <div className="p-4 bg-white space-y-3">
                                                                {pContracts.map(c => (
                                                                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-md border ${c.is_active ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50/50'} cursor-pointer hover:border-[#2568C1]/50`} onClick={() => onEditContract(c)}>
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold border-none ${c.is_active ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`} variant="outline">Custom Rate</Badge>
                                                                                <span className="text-xs font-bold text-slate-700 capitalize">{c.contract_type}</span>
                                                                                <span className="text-[10px] text-slate-400 uppercase">• {c.payment_scheme}</span>
                                                                            </div>
                                                                            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                                                                <Calendar className="h-3 w-3" />
                                                                                <span>{fmtDate(c.start_date)} &rarr; {c.end_date ? fmtDate(c.end_date) : 'Present'}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className="font-mono text-sm font-bold text-[#0f172a]">Rp {(c.rate_amount || 0).toLocaleString('id-ID')}</span>
                                                                            <div className="flex items-center gap-1">
                                                                                {c.is_active ? <span className="h-1.5 w-1.5 rounded-full bg-[#4B7BEC] animate-pulse" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                                                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{c.is_active ? 'Active Rate' : 'Historical'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={`transition-all duration-300 overflow-hidden border-t border-slate-200 bg-slate-50 ${isContractEditorOpen ? 'max-h-[500px] p-5 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]' : 'max-h-0 p-0'}`}>
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Edit className="h-4 w-4 text-[#2568C1]" /> {editingContractId ? "Edit Contract" : "New Contract Setup"}
                                </h4>
                                {isContractEditorOpen && (
                                    <button className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200" onClick={() => { onResetContractForm(); setIsContractEditorOpen(false); }}>Close Editor</button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Contract Type</label>
                                    <Select value={contractForm.contract_type} onValueChange={(v: any) => setContractForm({ ...contractForm, contract_type: v })} disabled={isSavingContract}>
                                        <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue placeholder="Select contract type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yearly" className="text-xs">Yearly Salary</SelectItem>
                                            <SelectItem value="monthly" className="text-xs">Monthly Salary</SelectItem>
                                            <SelectItem value="mandays" className="text-xs">Mandays Rate</SelectItem>
                                            <SelectItem value="timesheet" className="text-xs">Timesheet Rate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Payment Scheme</label>
                                    <Select value={contractForm.payment_scheme} onValueChange={(v: any) => setContractForm({ ...contractForm, payment_scheme: v })} disabled={isSavingContract}>
                                        <SelectTrigger className="h-9 text-xs bg-white border-slate-300"><SelectValue placeholder="Select payment scheme" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly" className="text-xs">Monthly Cycle</SelectItem>
                                            <SelectItem value="termin" className="text-xs">Termin/Milestone</SelectItem>
                                            <SelectItem value="back_to_back" className="text-xs">Back-to-Back</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rate Amount (Rp)</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 5.000.000"
                                        className="h-9 text-sm font-semibold bg-white border-slate-300"
                                        value={contractForm.rate_display || ""}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, "");
                                            setContractForm({
                                                ...contractForm,
                                                rate_amount: Number(raw),
                                                rate_display: raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ""
                                            });
                                        }}
                                        disabled={isSavingContract}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Project ID (Opt)</label>
                                    <Input type="number" placeholder="Leave blank for Base" className="h-9 text-xs bg-white border-slate-300" value={contractForm.project_id || ""} onChange={(e) => setContractForm({ ...contractForm, project_id: Number(e.target.value) || undefined })} disabled={isSavingContract} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mt-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Start Date</label>
                                    <CustomDatePicker date={contractForm.start_date} onDateChange={(date) => setContractForm({ ...contractForm, start_date: date })} disabled={isSavingContract} className="h-9 text-xs bg-white border-slate-300" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">End Date</label>
                                    <CustomDatePicker date={contractForm.end_date || ""} onDateChange={(date) => setContractForm({ ...contractForm, end_date: date })} disabled={isSavingContract} className="h-9 text-xs bg-white border-slate-300" placeholder="Optional" />
                                </div>
                                <div className="flex items-center gap-2 h-9">
                                    <input type="checkbox" className="rounded border-slate-300 text-[#2568C1] h-4 w-4 cursor-pointer" id="active-contract-chk" checked={contractForm.is_active} onChange={(e) => setContractForm({ ...contractForm, is_active: e.target.checked })} disabled={isSavingContract} />
                                    <label htmlFor="active-contract-chk" className="text-xs font-bold tracking-wide text-[#0f172a] cursor-pointer">Set as Active Contract</label>
                                </div>
                                <div>
                                    <Button className={`w-full h-9 text-xs font-semibold shadow-sm ${!editingContractId ? 'bg-gradient-to-r from-[#2568C1] to-[#1a4f99] hover:from-[#1e56a6] hover:to-[#174382]' : 'bg-slate-800 hover:bg-slate-900'}`} onClick={onSaveContract} disabled={isSavingContract}>
                                        {isSavingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingContractId ? "Update Contract" : "Save Contract Data")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

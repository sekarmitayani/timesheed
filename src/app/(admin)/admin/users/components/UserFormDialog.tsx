import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCog, ShieldX, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Role } from "@/lib/types";
import { CreateContractPayload } from "@/lib/services/admin-contracts";

interface UserFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editId: string | null;
    isSaving: boolean;
    form: any;
    setForm: (v: any) => void;
    contractForm: CreateContractPayload & { is_active: boolean, rate_display?: string };
    setContractForm: (v: any) => void;
    onSave: () => void;
    onCancel: () => void;
}

export function UserFormDialog({
    open, onOpenChange, editId, isSaving,
    form, setForm, contractForm, setContractForm,
    onSave, onCancel
}: UserFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(open) => !isSaving && onOpenChange(open)}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex flex-col gap-1">
                    <DialogTitle className="text-xl text-[#0f172a]">{editId ? "Edit User Profile" : "Register New User"}</DialogTitle>
                    <DialogDescription className="text-sm">
                        {editId ? "Update account status, access role, and credentials." : "Create a new employee or admin account for the system."}
                    </DialogDescription>
                </div>

                <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Account Basics Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <UserCog className="h-3.5 w-3.5" /> Account Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                <label className="text-sm font-medium text-[#0f172a]">Full Legal Name <span className="text-red-500">*</span></label>
                                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Jane Doe" className="bg-white" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                <label className="text-sm font-medium text-[#0f172a]">Email Address <span className="text-red-500">*</span></label>
                                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" className="bg-white" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                <label className="text-sm font-medium text-[#0f172a]">Phone Number <span className="text-red-500">*</span></label>
                                <Input type="tel" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, '') })} placeholder="08123456789" className="bg-white" disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                <label className="text-sm font-medium text-[#0f172a]">Password {editId ? "(Leave blank to keep)" : <span className="text-red-500">*</span>}</label>
                                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="bg-white" disabled={isSaving} />
                            </div>
                        </div>
                    </div>

                    {/* Role & Access Section */}
                    <div className="space-y-4 pt-2 border-t border-[#e2e8f0]">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ShieldX className="h-3.5 w-3.5" /> Access & Employment
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#0f172a]">System Role <span className="text-red-500">*</span></label>
                                <Select value={form.role} onValueChange={(v: Role) => setForm({ ...form, role: v })} disabled={isSaving}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="projectmanager">Project Manager</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="finance">Management</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className={`text-sm font-medium ${form.role === 'admin' ? 'text-muted-foreground' : 'text-[#0f172a]'}`}>
                                    Employment Type {form.role !== 'admin' && <span className="text-red-500">*</span>}
                                </label>
                                <Select
                                    value={form.role === 'admin' ? "" : form.employee_type}
                                    onValueChange={(v: any) => setForm({ ...form, employee_type: v })}
                                    disabled={form.role === 'admin' || isSaving}
                                >
                                    <SelectTrigger className={`bg-white ${form.role === 'admin' ? 'opacity-50' : ''}`}>
                                        <SelectValue placeholder={form.role === 'admin' ? "N/A for Admins" : "Select type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fulltime">Full-Time</SelectItem>
                                        <SelectItem value="parttime">Part-Time</SelectItem>
                                        <SelectItem value="freelance">Freelance Contract</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {form.role !== 'admin' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[#0f172a]">
                                        Skill Level <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={form.skill_level ? String(form.skill_level) : ""}
                                        onValueChange={(v: string) => setForm({ ...form, skill_level: Number(v) })}
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select skill level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Junior</SelectItem>
                                            <SelectItem value="2">Mid-Level</SelectItem>
                                            <SelectItem value="3">Senior</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {editId && (
                        <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50 mt-4">
                            <div className="space-y-0.5">
                                <h5 className="text-sm font-medium text-amber-800">Account Status</h5>
                                <p className="text-xs text-amber-600">Disabling an account revokes all access immediately.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{form.is_active ? "Active" : "Disabled"}</span>
                                <button
                                    type="button"
                                    role="switch"
                                    onClick={() => setForm((prev: any) => ({ ...prev, is_active: !prev.is_active }))}
                                    disabled={isSaving}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B7BEC] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${form.is_active ? 'bg-[#4B7BEC]' : 'bg-slate-300'}`}
                                >
                                    <span className={`pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${form.is_active ? 'translate-x-4 border-[#4B7BEC]' : 'translate-x-0.5 border-slate-300'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {!editId && form.role !== 'admin' && (
                        <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FolderKanban className="h-3.5 w-3.5" /> Set Initial Contract (Optional)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Contract Type</label>
                                    <Select value={contractForm.contract_type} onValueChange={(v: any) => setContractForm({ ...contractForm, contract_type: v })} disabled={isSaving}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select contract type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="timesheet">Timesheet</SelectItem>
                                            <SelectItem value="mandays">Mandays</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Payment Scheme</label>
                                    <Select value={contractForm.payment_scheme} onValueChange={(v: any) => setContractForm({ ...contractForm, payment_scheme: v })} disabled={isSaving}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select payment scheme" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="termin">Termin</SelectItem>
                                            <SelectItem value="back_to_back">Back-to-back</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Rate Amount (Rp)</label>
                                    <Input
                                        type="text"
                                        placeholder="5.000.000"
                                        className="bg-white"
                                        value={contractForm.rate_display || ""}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, "");
                                            setContractForm({
                                                ...contractForm,
                                                rate_amount: Number(raw),
                                                rate_display: raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ""
                                            });
                                        }}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">Start Date</label>
                                    <CustomDatePicker date={contractForm.start_date} onDateChange={(date) => setContractForm({ ...contractForm, start_date: date })} disabled={isSaving} className="h-10 px-3 py-2 text-sm" />
                                </div>
                                <div className="space-y-1.5 flex-1 col-span-2 sm:col-span-1">
                                    <label className="text-sm font-medium text-[#0f172a]">End Date (Optional)</label>
                                    <CustomDatePicker date={contractForm.end_date || ""} onDateChange={(date) => setContractForm({ ...contractForm, end_date: date })} disabled={isSaving} className="h-10 px-3 py-2 text-sm" placeholder="Optional" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel} disabled={isSaving} className="text-[#64748b]">Cancel</Button>
                    <Button onClick={() => {
                        if (!form.full_name?.trim() || !form.email?.trim() || !form.phone_number?.trim() || !form.role) {
                            toast.error("Please fill in all required fields");
                            return;
                        }
                        if (!editId && !form.password?.trim()) {
                            toast.error("Password is required for new users");
                            return;
                        }
                        if (form.role !== 'admin' && (!form.employee_type || !form.skill_level)) {
                            toast.error("Employment Type and Skill Level are required");
                            return;
                        }
                        onSave();
                    }} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] shadow-md shadow-[#2568C1]/20 min-w-[120px]">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editId ? "Save Changes" : "Create User")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

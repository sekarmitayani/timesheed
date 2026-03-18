"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { Plus, Trash2, Edit, Loader2, Search, AlertTriangle, Eye, Calendar, Mail, FileText, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { toast } from "sonner";
import {
    adminContractService, Contract, CreateContractPayload, UpdateContractPayload, PaymentScheme
} from "@/lib/services/admin-contracts";
import { adminUserService } from "@/lib/services/admin-users";
import { projectService } from "@/lib/services/project-service";
import { User, ApiProject } from "@/lib/types";

// ---- Helpers ----
function formatNumber(value: number | string): string {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : String(value);
    if (!num) return "";
    return Number(num).toLocaleString("id-ID");
}

const fmtDate = (d?: string) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const contractTypeColor = (t: string) => {
    switch (t) {
        case "yearly": return "bg-rose-50 text-rose-700 border-rose-200";
        case "monthly": return "bg-purple-50 text-purple-700 border-purple-200";
        case "mandays": return "bg-cyan-50 text-cyan-700 border-cyan-200";
        case "timesheet": return "bg-blue-50 text-blue-700 border-blue-200";
        default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
};

const paymentSchemeColor = (s: string) => {
    switch (s) {
        case "back_to_back": return "bg-teal-50 text-teal-700 border-teal-200";
        case "termin": return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "monthly": return "bg-purple-50 text-purple-700 border-purple-200";
        default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
};

const paymentSchemeLabel = (s: string) => {
    switch (s) {
        case "back_to_back": return "Back-to-back";
        case "termin": return "Termin";
        case "monthly": return "Monthly";
        default: return s;
    }
};

export default function ContractsPage() {
    // Contracts
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [schemeFilter, setSchemeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Users and Projects for dropdown and detailed mapping
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allProjects, setAllProjects] = useState<ApiProject[]>([]);

    // Create/Edit Dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [contractForm, setContractForm] = useState({
        user_id: 0,
        contract_type: "monthly" as "yearly" | "monthly" | "mandays" | "timesheet",
        payment_scheme: "monthly" as PaymentScheme,
        rate_amount: 0,
        rate_display: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        is_active: true,
    });

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

    // Details Modal
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    // ---- Fetch All Contracts ----
    const fetchContracts = useCallback(async () => {
        setIsLoading(true);
        try {
            let userList = allUsers;
            if (userList.length === 0) {
                const usersRes = await adminUserService.getUsers(1, 100);
                userList = usersRes.data || [];
                setAllUsers(userList);
            }

            const projectsRes = await projectService.getProjects(1, 100);
            setAllProjects(projectsRes.data || []);

            const allContracts: Contract[] = [];
            for (const u of userList) {
                try {
                    const c = await adminContractService.getUserContracts(u.id);
                    allContracts.push(...c);
                } catch { /* skip */ }
            }
            // Ensure sorting by newest (although backend provides it sorted, joining multiple requests requires manual sort)
            allContracts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setContracts(allContracts);
        } catch (e: any) {
            toast.error(e.message || "Failed to fetch contracts");
        } finally {
            setIsLoading(false);
        }
    }, [allUsers]);

    useEffect(() => { fetchContracts(); }, [fetchContracts]);

    // Used for simple name extractions
    const getUserContext = (userId: number) => {
        return allUsers.find(u => Number(u.id) === userId);
    };

    // ---- Contract CRUD ----
    const resetContractForm = () => {
        setEditId(null);
        setContractForm({
            user_id: 0, contract_type: "monthly", payment_scheme: "monthly",
            rate_amount: 0, rate_display: "",
            start_date: new Date().toISOString().split("T")[0], end_date: "", is_active: true,
        });
    };

    const openEdit = (c: Contract) => {
        setEditId(c.id);
        setContractForm({
            user_id: c.user_id,
            contract_type: c.contract_type,
            payment_scheme: c.payment_scheme || "monthly",
            rate_amount: c.rate_amount,
            rate_display: formatNumber(c.rate_amount),
            start_date: c.start_date.split("T")[0],
            end_date: c.end_date ? c.end_date.split("T")[0] : "",
            is_active: c.is_active,
        });
        setFormOpen(true);
    };

    const handleSaveContract = async () => {
        setIsSaving(true);
        try {
            if (editId) {
                const payload: UpdateContractPayload = {
                    contract_type: contractForm.contract_type,
                    payment_scheme: contractForm.payment_scheme,
                    rate_amount: contractForm.rate_amount,
                    start_date: contractForm.start_date,
                    end_date: contractForm.end_date || null,
                    is_active: contractForm.is_active,
                };
                await adminContractService.updateContract(editId, payload);
                toast.success("Contract updated successfully!");
            } else {
                if (!contractForm.user_id) { toast.error("Select a user"); setIsSaving(false); return; }
                const payload: CreateContractPayload = {
                    user_id: Number(contractForm.user_id),
                    contract_type: contractForm.contract_type,
                    payment_scheme: contractForm.payment_scheme,
                    rate_amount: contractForm.rate_amount,
                    start_date: contractForm.start_date,
                    end_date: contractForm.end_date || null,
                    is_active: contractForm.is_active,
                };
                await adminContractService.createContract(payload);
                toast.success("Contract created successfully!");
            }
            setFormOpen(false);
            resetContractForm();
            fetchContracts();
        } catch (e: any) {
            toast.error(e.message || "Failed to save contract");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteContract = async () => {
        if (!contractToDelete) return;
        setIsSaving(true);
        try {
            await adminContractService.deleteContract(contractToDelete.id);
            toast.success("Contract deleted successfully!");
            setDeleteOpen(false);
            setContractToDelete(null);
            fetchContracts();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete");
        } finally {
            setIsSaving(false);
        }
    };

    const openDetails = (c: Contract) => {
        setSelectedContract(c);
        setDetailsOpen(true);
    };

    // ---- Filtered & Paginated ----
    const filtered = contracts.filter(c => {
        const u = getUserContext(c.user_id);
        const name = (u?.full_name || u?.name || "").toLowerCase();

        const matchSearch = name.includes(search.toLowerCase());
        const matchType = typeFilter === "all" || c.contract_type === typeFilter;
        const matchScheme = schemeFilter === "all" || c.payment_scheme === schemeFilter;
        let matchStatus = true;

        if (statusFilter === "active") matchStatus = c.is_active === true;
        if (statusFilter === "inactive") matchStatus = c.is_active === false;

        return matchSearch && matchType && matchScheme && matchStatus;
    });

    // Filter project context based on populated contracts
    const activeProjectsCtx = Array.from(new Set(contracts.map(c => c.project_id).filter(Boolean)));
    const [projectFilter, setProjectFilter] = useState("all");

    // Recalculate filtered based on the new project context
    const fullyFiltered = filtered.filter(c => {
        if (projectFilter === "all") return true;
        if (projectFilter === "base") return !c.project_id;
        return c.project_id === Number(projectFilter);
    });

    const fullyPaginated = fullyFiltered.slice((currentPage - 1) * limit, currentPage * limit);
    const fullyTotalPages = Math.ceil(fullyFiltered.length / limit);

    return (
        <div className="space-y-6">
            <PageHeader title="Contract Administration" description={`Managing ${contracts.length} active and historical agreements`}>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99] shadow-md shadow-[#2568C1]/20" onClick={() => { resetContractForm(); setFormOpen(true); }}>
                    <Plus className="h-4 w-4" /> New Contract
                </Button>
            </PageHeader>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px] shrink-0">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search Employee..." className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1]" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-[120px] bg-white shrink-0"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 w-[140px] bg-white shrink-0"><SelectValue placeholder="Contract Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="mandays">Mandays</SelectItem>
                            <SelectItem value="timesheet">Timesheet</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={schemeFilter} onValueChange={setSchemeFilter}>
                        <SelectTrigger className="h-10 w-[150px] bg-white shrink-0"><SelectValue placeholder="Payment Scheme" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Schemes</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="termin">Termin</SelectItem>
                            <SelectItem value="back_to_back">Back-to-back</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="h-10 w-[150px] bg-white shrink-0"><SelectValue placeholder="Projects" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            <SelectItem value="base">General/Base Rate</SelectItem>
                            {activeProjectsCtx.map(pid => {
                                const pName = allProjects.find(p => p.id === pid)?.name || `Project #${pid}`;
                                return (
                                    <SelectItem key={pid} value={String(pid)}>{pName}</SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 w-12 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                    <TableHead className="w-[280px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Payment Scheme</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Period & Rate</TableHead>
                                    <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[140px] pr-10 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={7} className="h-48  text-center"><div className="flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" /><p>Gathering contracts records...</p></div></TableCell></TableRow>
                                ) : fullyPaginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="h-32 text-slate-400 text-center">No contracts matching your filters.</TableCell></TableRow>
                                ) : (
                                    fullyPaginated.map((c, index) => {
                                        const globalIndex = (currentPage - 1) * limit + index + 1;
                                        const uContext = getUserContext(c.user_id);
                                        return (
                                            <TableRow key={c.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                                <TableCell className="pl-6 text-sm text-muted-foreground font-medium">
                                                    {globalIndex}
                                                </TableCell>
                                                <TableCell className="">
                                                    <div className="flex gap-3">
                                                        <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm">
                                                            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-[#2568C1] to-[#1a4f99] text-white">
                                                                {(uContext?.name || "U").substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-slate-700">{uContext?.full_name || uContext?.name || `User #${c.user_id}`}</span>
                                                            <span className="text-[11px] text-slate-400">
                                                                {uContext?.email || "Unknown Email"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="">
                                                    <span className="text-xs font-semibold text-slate-500 capitalize">{c.contract_type}</span>
                                                </TableCell>
                                                <TableCell className="">
                                                    <span className="text-xs font-semibold text-slate-500 capitalize">{paymentSchemeLabel(c.payment_scheme)}</span>
                                                </TableCell>
                                                <TableCell className="">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-bold text-slate-700 tracking-tight">Rp {formatNumber(c.rate_amount)}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase flex gap-1">
                                                            {fmtDate(c.start_date)} &rarr; {c.end_date ? fmtDate(c.end_date) : "Present"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="">
                                                    <Badge className={`text-[10px] capitalize font-bold tracking-wider rounded-full px-2.5 py-0.5 ${c.is_active
                                                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-transparent"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent"}`}>
                                                        {c.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="">
                                                    <div className="flex justify-start gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => openDetails(c)} title="View Contract Details">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-[#2568C1] hover:bg-[#2568C1]/10 rounded-full" onClick={() => openEdit(c)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => { setContractToDelete(c); setDeleteOpen(true); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {fullyTotalPages > 0 && (
                        <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * limit, contracts.length)}</span> of <span className="font-medium text-[#0f172a]">{contracts.length}</span> contracts
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <div className="text-xs font-medium px-2">Page {currentPage} of {fullyTotalPages}</div>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= fullyTotalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, fullyTotalPages))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Contract Dialog  (Untouched logic, polished UI styling) */}
            <Dialog open={formOpen} onOpenChange={open => !isSaving && setFormOpen(open)}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-xl text-[#0f172a]">{editId ? "Edit Contract Data" : "New Contract Setup"}</DialogTitle>
                        <DialogDescription className="text-sm">{editId ? "Modify existing employment terms" : "Bind a new employment rate to a user profile"}</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        {!editId && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">User <span className="text-red-500">*</span></label>
                                <Select value={String(contractForm.user_id || "")} onValueChange={v => setContractForm({ ...contractForm, user_id: Number(v) })}>
                                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                    <SelectContent>{allUsers.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Contract Type</label>
                                <Select value={contractForm.contract_type} onValueChange={(v: any) => setContractForm({ ...contractForm, contract_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                <Select value={contractForm.payment_scheme} onValueChange={(v: any) => setContractForm({ ...contractForm, payment_scheme: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                value={contractForm.rate_amount || ""}
                                onChange={(v: any) => {
                                    setContractForm({
                                        ...contractForm,
                                        rate_amount: Number(v) || 0,
                                    });
                                }}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input type="date" value={contractForm.start_date} onChange={e => setContractForm({ ...contractForm, start_date: e.target.value })} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">End Date</label>
                                <Input type="date" value={contractForm.end_date} onChange={e => setContractForm({ ...contractForm, end_date: e.target.value })} disabled={isSaving} />
                            </div>
                        </div>
                        {editId && (
                            <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input type="checkbox" className="rounded border-amber-400 accent-amber-600" checked={contractForm.is_active} onChange={e => setContractForm({ ...contractForm, is_active: e.target.checked })} />
                                    This contract is currently <b>Active</b>
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => { setFormOpen(false); resetContractForm(); }} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSaveContract} disabled={isSaving} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save Changes" : "Create Contract"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Contract Dialog */}
            <Dialog open={deleteOpen} onOpenChange={open => !isSaving && setDeleteOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                        <DialogTitle className="text-center">Delete Contract Data?</DialogTitle>
                    </DialogHeader>
                    <p className="text-center text-sm text-[#475569]">This will permanently remove the contract block for <b>{contractToDelete ? getUserContext(contractToDelete.user_id)?.name : ""}</b>. This action represents data destruction and cannot be undone.</p>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteContract} disabled={isSaving} className="min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Identity"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contract Complete Details Profile */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] p-0 overflow-hidden border-[#e2e8f0] flex flex-col">
                    <div className="bg-gradient-to-r from-slate-50 to-[#f8fafc] border-b border-[#e2e8f0] px-5 py-4 flex items-center gap-3 shrink-0">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                            <FileText className="h-5 w-5 text-[#2568C1]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base text-[#0f172a] mb-0.5">Contract Intelligence</DialogTitle>
                            <DialogDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Detailed specification overview
                            </DialogDescription>
                        </div>
                    </div>

                    {selectedContract && (
                        <div className="px-5 pt-3 pb-5 space-y-4 bg-slate-50/30 overflow-y-auto">

                            <div className="grid grid-cols-1 gap-4">
                                <Card className="p-4 shadow-sm border-slate-200 bg-white space-y-0.5">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Identity</div>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-200">
                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                                {(getUserContext(selectedContract.user_id)?.name || "U").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{getUserContext(selectedContract.user_id)?.full_name || getUserContext(selectedContract.user_id)?.name}</span>
                                            <span className="text-[11px] text-slate-500">{getUserContext(selectedContract.user_id)?.email}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <Card className="p-4 shadow-sm border-slate-200 bg-white space-y-0.5">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin Binding Node</div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${selectedContract.project_id ? "bg-purple-100 text-purple-700" : "bg-[#2568C1]/10 text-[#2568C1]"}`}>
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{selectedContract.project_id ? (allProjects.find(p => p.id === selectedContract.project_id)?.name || `Project #${selectedContract.project_id}`) : "Base Employee General Rate"}</span>
                                        <span className="text-[11px] text-slate-500">{selectedContract.project_id ? "Custom External Bound (Overrides base-rate for this project)" : "Internal Default Bound (Applied generically unless overridden)"}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5 shadow-sm border-slate-200 bg-white border-l-4 border-l-[#2568C1]">
                                <h4 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">Contract Data Block</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-4">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0">Contract Status</div>
                                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${selectedContract.is_active ? "bg-emerald-50 text-emerald-600 border-none" : "bg-slate-100 text-slate-500 border-none"}`}>
                                            {selectedContract.is_active ? "Active" : "Historical"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0">Agreement Type</div>
                                        <div className="text-sm font-semibold capitalize text-slate-800">{selectedContract.contract_type}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0">Scheme Sequence</div>
                                        <div className="text-sm font-semibold capitalize text-slate-800">{paymentSchemeLabel(selectedContract.payment_scheme)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0">Value Payload</div>
                                        <div className="text-sm font-bold text-[#2568C1] font-mono tracking-tight">Rp {formatNumber(selectedContract.rate_amount)}</div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0 flex items-center gap-1"><Calendar className="h-3 w-3" /> Period Start</div>
                                        <div className="text-sm font-semibold text-slate-800">{fmtDate(selectedContract.start_date)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0 flex items-center gap-1"><Calendar className="h-3 w-3" /> Period End</div>
                                        <div className="text-sm font-semibold text-slate-800">{selectedContract.end_date ? fmtDate(selectedContract.end_date) : "Ongoing / Open"}</div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 px-2 uppercase tracking-wider">
                                <span>Record Initially Created: {fmtDate(selectedContract.created_at)}</span>
                                <span>Last Sync: {fmtDate(selectedContract.updated_at)}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t border-slate-200 bg-white p-4">
                        <Button className="w-full bg-[#0f172a] hover:bg-slate-800 transition-colors" onClick={() => setDetailsOpen(false)}>Acknowledge & Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

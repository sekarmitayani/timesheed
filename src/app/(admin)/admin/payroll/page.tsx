"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatCard } from "@/components/ai/ai-components";
import { Search, Loader2, DollarSign, WalletCards, Activity, Trash2, Calendar, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { toast } from "sonner";
import {
    adminContractService, Contract, ContractPayment, ContractSummary, UpdatePaymentPayload
} from "@/lib/services/admin-contracts";
import { adminUserService } from "@/lib/services/admin-users";
import { projectService } from "@/lib/services/project-service";
import { User, ApiProject } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---- Types ----
type ContractWithStatus = Contract & {
    paymentStatus: "pending" | "partially_paid" | "paid";
    totalPaid: number;
};

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

const summaryStatusColor = (s: string) => {
    if (s === "Paid") return "bg-emerald-50 text-emerald-600 border-none";
    if (s === "PartiallyPaid") return "bg-amber-50 text-amber-600 border-none";
    return "bg-slate-100 text-slate-500 border-none";
};

export default function PaymentsPage() {
    // Core Data
    const [allContracts, setAllContracts] = useState<ContractWithStatus[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allProjects, setAllProjects] = useState<ApiProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters & Pagination
    const [search, setSearch] = useState("");
    const [schemeFilter, setSchemeFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Payments Sub-ledger Dialog
    const [paymentsOpen, setPaymentsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<ContractWithStatus | null>(null);
    const [payments, setPayments] = useState<ContractPayment[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        name: "", amount: 0, amount_display: "", paid_at: new Date().toISOString().split("T")[0], description: "",
    });
    const [contractSummary, setContractSummary] = useState<ContractSummary | null>(null);

    // Stats
    const [globalStats, setGlobalStats] = useState({ target: 0, released: 0, pending: 0, partiallyPaid: 0, paid: 0 });

    // ---- Fetch Data ----
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Get Users and Projects
            const [usersRes, projectsRes] = await Promise.all([
                adminUserService.getUsers(1, 100),
                projectService.getProjects()
            ]);
            const userList = usersRes.data || [];
            setAllUsers(userList);
            setAllProjects(projectsRes.data || []);

            // 2. Get Contracts
            const fetchList: Contract[] = [];
            for (const u of userList) {
                try {
                    const c = await adminContractService.getUserContracts(u.id);
                    fetchList.push(...c);
                } catch { /* skip */ }
            }

            // 3. Include ALL contract schemes (monthly, termin, back_to_back)
            const validContracts = fetchList;
            validContracts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const enhancedContracts: ContractWithStatus[] = await Promise.all(validContracts.map(async (c) => {
                try {
                    const payments = await adminContractService.getPayments(c.id);
                    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                    let paymentStatus: "pending" | "partially_paid" | "paid" = "pending";
                    if (totalPaid > 0 && totalPaid < c.rate_amount) paymentStatus = "partially_paid";
                    else if (totalPaid >= c.rate_amount) paymentStatus = "paid";
                    return { ...c, totalPaid, paymentStatus };
                } catch {
                    return { ...c, totalPaid: 0, paymentStatus: "pending" };
                }
            }));

            setAllContracts(enhancedContracts);

        } catch (e: any) {
            toast.error(e.message || "Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const target = allContracts.reduce((acc, curr) => acc + curr.rate_amount, 0);
        const released = allContracts.reduce((acc, curr) => acc + curr.totalPaid, 0);
        const pending = allContracts.filter(c => c.paymentStatus === "pending").length;
        const partiallyPaid = allContracts.filter(c => c.paymentStatus === "partially_paid").length;
        const paid = allContracts.filter(c => c.paymentStatus === "paid").length;
        setGlobalStats({ target, released, pending, partiallyPaid, paid });
    }, [allContracts]);

    const getUserContext = (userId: number) => allUsers.find(u => Number(u.id) === userId);

    // ---- Payments Sub-ledger View ----
    const openPayments = async (c: ContractWithStatus) => {
        setSelectedContract(c);
        setPaymentsOpen(true);
        resetPaymentForm();
        setContractSummary(null);
        fetchPayments(c.id);
    };

    const fetchPayments = async (contractId: number) => {
        setIsLoadingPayments(true);
        try {
            const res = await adminContractService.getPayments(contractId);
            const pArr = Array.isArray(res) ? res : [];
            setPayments(pArr);

            const totalPaid = pArr.reduce((sum, p) => sum + p.amount, 0);
            const target = selectedContract?.rate_amount || allContracts.find(c => c.id === contractId)?.rate_amount || 0;

            setContractSummary({
                contract_target: target,
                total_paid: totalPaid,
                remaining: Math.max(0, target - totalPaid),
                status: totalPaid === 0 ? "Pending" : totalPaid >= target ? "Paid" : "PartiallyPaid",
            });

            // Update local ledger gracefully
            setAllContracts(prev => prev.map(c => {
                if (c.id === contractId) {
                    let paymentStatus: "pending" | "partially_paid" | "paid" = "pending";
                    if (totalPaid > 0 && totalPaid < c.rate_amount) paymentStatus = "partially_paid";
                    else if (totalPaid >= c.rate_amount) paymentStatus = "paid";
                    return { ...c, totalPaid, paymentStatus };
                }
                return c;
            }));
        } catch (e: any) {
            toast.error(e.message || "Failed to fetch payments");
        } finally {
            setIsLoadingPayments(false);
        }
    };

    const resetPaymentForm = () => {
        setEditingPaymentId(null);
        setPaymentForm({ name: "", amount: 0, amount_display: "", paid_at: new Date().toISOString().split("T")[0], description: "" });
    };

    const handleSavePayment = async () => {
        if (!selectedContract) return;
        if (!paymentForm.name || !paymentForm.amount) { toast.error("Name and amount are required"); return; }
        setIsSavingPayment(true);
        try {
            if (editingPaymentId) {
                const payload: UpdatePaymentPayload = {
                    name: paymentForm.name, amount: paymentForm.amount,
                    paid_at: paymentForm.paid_at, description: paymentForm.description,
                };
                await adminContractService.updatePayment(editingPaymentId, payload);
                toast.success("Payment updated successfully!");
            } else {
                const res = await adminContractService.addPayment(selectedContract.id, {
                    name: paymentForm.name,
                    amount: paymentForm.amount,
                    paid_at: paymentForm.paid_at || new Date().toISOString().split("T")[0],
                    description: paymentForm.description || "",
                });
                toast.success(res.message || "Payment recorded successfully!");
                if (res.contract_summary) setContractSummary(res.contract_summary);
            }
            resetPaymentForm();
            fetchPayments(selectedContract.id);
        } catch (e: any) {
            toast.error(e.message || "Failed to save payment");
        } finally {
            setIsSavingPayment(false);
        }
    };

    const handleDeletePayment = async (id: number) => {
        if (!selectedContract) return;
        setIsSavingPayment(true);
        try {
            await adminContractService.deletePayment(id);
            toast.success("Payment deleted successfully!");
            fetchPayments(selectedContract.id);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete payment");
        } finally {
            setIsSavingPayment(false);
        }
    };

    const editPayment = (p: ContractPayment) => {
        setEditingPaymentId(p.id);
        setPaymentForm({
            name: p.name, amount: p.amount, amount_display: formatNumber(p.amount),
            paid_at: p.paid_at.split("T")[0], description: p.description,
        });
    };


    // ---- Filtered & Paginated ----
    const filtered = allContracts.filter(c => {
        const name = (getUserContext(c.user_id)?.name || "").toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) || c.payment_scheme.toLowerCase().includes(search.toLowerCase());
        const matchesScheme = schemeFilter === "all" || c.payment_scheme === schemeFilter;
        const matchesProject = projectFilter === "all" || c.project_id?.toString() === projectFilter;
        const matchesStatus = statusFilter === "all" || c.paymentStatus === statusFilter;
        return matchesSearch && matchesScheme && matchesProject && matchesStatus;
    });

    const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);
    const totalPages = Math.ceil(filtered.length / limit);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Payroll Ledger" description="Authorize and record disbursements for all contract schemes" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Outstanding Bills" value={`Rp ${(globalStats.target - globalStats.released) / 1000000}M`} subtitle={`Target: Rp ${(globalStats.target / 1000000).toFixed(1)}M`} icon={WalletCards} glow />
                <StatCard title="Pending" value={globalStats.pending.toString()} subtitle="Contracts" icon={Calendar} />
                <StatCard title="Partially Paid" value={globalStats.partiallyPaid.toString()} subtitle="Contracts" icon={Activity} />
                <StatCard title="Done" value={globalStats.paid.toString()} subtitle="Contracts" icon={FileText} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-3 items-center w-full flex-wrap">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search employee..." className="pl-9 h-10 w-full bg-white border-slate-200 focus-visible:ring-[#2568C1]" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={schemeFilter} onValueChange={setSchemeFilter}>
                        <SelectTrigger className="w-[160px] h-10 bg-white"><SelectValue placeholder="Scheme" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Schemes</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="termin">Termin</SelectItem>
                            <SelectItem value="back_to_back">Back-to-back</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="w-[180px] h-10 bg-white"><SelectValue placeholder="Project" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {allProjects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-10 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <TableHead className="pl-6 w-[50px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                <TableHead className="w-[240px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">User</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Scheme</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Origin</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Target / Rate</TableHead>
                                <TableHead className=" text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                <TableHead className="w-32 text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="h-48  text-center"><div className="flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" /><p>Assembling ledger records...</p></div></TableCell></TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-32 text-slate-400 text-center">No eligible payment contracts found.</TableCell></TableRow>
                            ) : (
                                paginated.map((c, index) => {
                                    const globalIndex = (currentPage - 1) * limit + index + 1;
                                    const uContext = getUserContext(c.user_id);
                                    return (
                                        <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                            <TableCell className="pl-6 text-sm text-slate-500 font-medium">
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
                                                        <span className="text-[11px] text-slate-400">{uContext?.email || "Unknown Email"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="">
                                                <div className="flex flex-col gap-0.5">
                                                    <Badge variant="outline" className={`capitalize text-[10px] font-bold px-2.5 py-0.5 tracking-wider w-fit rounded-full border-none ${c.payment_scheme === 'back_to_back' ? "bg-teal-50 text-teal-700" : c.payment_scheme === 'monthly' ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}>
                                                        {c.payment_scheme === 'back_to_back' ? 'Back-to-back' : c.payment_scheme === 'monthly' ? 'Monthly' : 'Termin'}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-400">{c.contract_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="">
                                                <div className="flex flex-col gap-0.5">
                                                    <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-0.5 tracking-wider w-fit rounded-full border-none ${(c as any).origin === 'Custom Rate' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-600'}`}>
                                                        {(c as any).origin || 'Base Rate'}
                                                    </Badge>
                                                    {(c as any).project_name && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{(c as any).project_name}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">Rp {formatNumber(c.rate_amount)}</span>
                                                    {c.payment_scheme === 'monthly' && <span className="text-[10px] text-blue-500 italic">per month</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="">
                                                <Badge variant="outline" className={`uppercase text-[10px] font-bold px-2.5 py-0.5 tracking-wider rounded-full border-none ${c.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                    c.paymentStatus === 'partially_paid' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {c.paymentStatus === 'partially_paid' ? 'Partially Paid' : c.paymentStatus === 'paid' ? 'DONE' : 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="">
                                                <Button size="sm" className="h-8 text-xs bg-[#2568C1] hover:bg-[#1e56a6] w-auto px-4 gap-1 shadow-sm rounded-lg border-none" onClick={() => openPayments(c)}>
                                                    <DollarSign className="h-3 w-3" /> Execute
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * limit, filtered.length)}</span> of <span className="font-medium text-[#0f172a]">{filtered.length}</span> entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</div>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sub-ledger Payments Control Interface */}
            <Dialog open={paymentsOpen} onOpenChange={open => !isSavingPayment && setPaymentsOpen(open)}>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-[#e2e8f0] bg-white">
                    <div className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 px-6 py-5 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-200">
                            <WalletCards className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg text-[#0f172a] mb-1">Ledger Distribution Window</DialogTitle>
                            <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                User: <span className="text-slate-700">{selectedContract ? getUserContext(selectedContract.user_id)?.name : ""}</span>
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Meta & Summary Ribbon */}
                    {contractSummary && (
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Scheme</div>
                                    <Badge variant="outline" className={`text-[9px] font-bold rounded-full px-2.5 py-0.5 border-none ${selectedContract?.payment_scheme === 'back_to_back' ? "bg-teal-50 text-teal-700" : selectedContract?.payment_scheme === 'monthly' ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}>
                                        {selectedContract?.payment_scheme === 'back_to_back' ? 'Back-to-back' : selectedContract?.payment_scheme === 'monthly' ? 'Monthly' : 'Termin'}
                                    </Badge>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{selectedContract?.contract_type}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Origin</div>
                                    <Badge variant="outline" className={`text-[9px] font-bold rounded-full px-2.5 py-0.5 border-none ${(selectedContract as any)?.origin === 'Custom Rate' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {(selectedContract as any)?.origin || 'Base Rate'}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Project</div>
                                    <div className="text-sm font-semibold text-slate-700 truncate">{(selectedContract as any)?.project_name || 'Global (No Project)'}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">{selectedContract?.payment_scheme === 'monthly' ? 'Rate / Month' : 'Cap Target'}</div>
                                    <div className="text-sm font-black text-[#0f172a]">Rp {formatNumber(contractSummary.contract_target)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Disbursed</div>
                                    <div className="text-sm font-black text-emerald-600">Rp {formatNumber(contractSummary.total_paid)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</div>
                                    <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest rounded-full px-2.5 py-0.5 border-none ${summaryStatusColor(contractSummary.status)}`}>{contractSummary.status}</Badge>
                                </div>
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
                                        <Card key={p.id} className="p-3.5 space-y-2 border border-slate-200 hover:border-emerald-300 transition-colors shadow-sm cursor-pointer bg-white" onClick={() => editPayment(p)}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-sm font-bold text-slate-800 tracking-tight block">{p.name}</span>
                                                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="h-2.5 w-2.5" /> {fmtDate(p.paid_at.split("T")[0])}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-sm font-black text-emerald-600 tracking-tight">Rp {formatNumber(p.amount)}</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:text-red-700 hover:bg-red-50" onClick={e => { e.stopPropagation(); handleDeletePayment(p.id); }} disabled={isSavingPayment}>
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
                                    <Button variant="ghost" className="h-5 text-[10px] font-bold uppercase tracking-wider px-2 text-indigo-600 hover:bg-indigo-50" onClick={resetPaymentForm}>Abort Edit</Button>
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
                                    <label className="text-xs font-bold text-slate-700">Execution Date</label>
                                    <Input type="date" className="h-9 text-sm border-slate-200 text-slate-600 font-medium" value={paymentForm.paid_at || ""} onChange={e => setPaymentForm({ ...paymentForm, paid_at: e.target.value })} disabled={isSavingPayment} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Attached Description</label>
                                    <Input className="h-9 text-sm border-slate-200" placeholder="Optional notes regarding clearance..." value={paymentForm.description || ""} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} disabled={isSavingPayment} />
                                </div>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm h-10 mt-4 text-sm font-bold tracking-wide" onClick={handleSavePayment} disabled={isSavingPayment}>
                                    {isSavingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPaymentId ? "Commit Changes" : "Commit Execution"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

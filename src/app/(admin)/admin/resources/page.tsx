"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    Loader2,
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar,
    DollarSign,
    Clock,
    User as UserIcon,
    Briefcase,
    AlertTriangle,
    Filter,
    Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resourceService, ResourceRequest, ApprovalActionPayload, EditResourcePayload } from "@/lib/services/resource-service";
import { projectService } from "@/lib/services/project-service";
import { ApiProject } from "@/lib/types";

const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-red-50 text-red-700 border-red-100",
};
const statusDotColors: Record<string, string> = {
    pending: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-red-500",
};

export default function AdminResourcesPage() {
    const [requests, setRequests] = useState<ResourceRequest[]>([]);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterProject, setFilterProject] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Create Request
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ project_id: "", type: "manpower", details: "" });

    // Detail Dialog
    const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailMode, setDetailMode] = useState<"view" | "approve" | "reject" | "edit">("view");

    // Action States
    const [approveAmount, setApproveAmount] = useState<number>(0);
    const [needsConfirmZero, setNeedsConfirmZero] = useState(false);
    const [editForm, setEditForm] = useState<EditResourcePayload>({});
    const [deleteOpen, setDeleteOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [reqsRes, projsRes] = await Promise.all([
                resourceService.getResourceRequests(),
                projectService.getProjects(1, 100)
            ]);
            setRequests(Array.isArray(reqsRes) ? reqsRes : []);
            setProjects(projsRes.data || []);
        } catch (e: any) {
            toast.error(e.message || "Failed to load data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        if (!createForm.project_id || !createForm.details) {
            toast.error("Please fill project and details");
            return;
        }
        setIsProcessing(true);
        try {
            await resourceService.createResourceRequest({
                project_id: Number(createForm.project_id),
                type: createForm.type,
                details: createForm.details
            });
            toast.success("Resource request created!");
            setCreateOpen(false);
            setCreateForm({ project_id: "", type: "manpower", details: "" });
            fetchData();
        } catch (e: any) {
            toast.error(e.message || "Failed to create request");
        } finally {
            setIsProcessing(false);
        }
    };

    const openDetail = (r: ResourceRequest, mode: "view" | "approve" | "reject" | "edit" = "view") => {
        setSelectedRequest(r);
        setDetailMode(mode);
        setApproveAmount(r.amount || 0);
        setNeedsConfirmZero(false);
        setEditForm({ type: r.type, details: r.details, amount: r.amount, status: r.status });
        setDetailOpen(true);
    };

    const handleApprove = async (confirmZero: boolean = false) => {
        if (!selectedRequest) return;
        setIsProcessing(true);
        try {
            const payload: ApprovalActionPayload = {
                status: "approved",
                amount: Number(approveAmount),
                confirm_zero: confirmZero,
            };
            await resourceService.approvalAction(selectedRequest.id, payload);
            toast.success("Request approved!");
            setDetailOpen(false);
            fetchData();
        } catch (e: any) {
            if (e.data?.need_confirmation || e.message?.includes("confirm_zero")) {
                setNeedsConfirmZero(true);
                toast.warning("Realization amount is 0. Confirm to proceed.");
            } else {
                toast.error(e.message || "Failed to approve");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        setIsProcessing(true);
        try {
            await resourceService.approvalAction(selectedRequest.id, { status: "rejected" });
            toast.success("Request rejected");
            setDetailOpen(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.message || "Failed to reject");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEdit = async (confirmZero: boolean = false) => {
        if (!selectedRequest) return;
        setIsProcessing(true);
        try {
            const payload: EditResourcePayload = { ...editForm, confirm_zero: confirmZero };
            await resourceService.editResource(selectedRequest.id, payload);
            toast.success("Request updated");
            setDetailOpen(false);
            fetchData();
        } catch (e: any) {
            if (e.data?.need_confirmation || e.message?.includes("confirm_zero")) {
                toast.warning("Amount is 0. Confirm to proceed.");
            } else {
                toast.error(e.message || "Failed to update");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedRequest) return;
        setIsProcessing(true);
        try {
            await resourceService.deleteResourceRequest(selectedRequest.id);
            toast.success("Request deleted successfully");
            setDeleteOpen(false);
            setDetailOpen(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete request");
        } finally {
            setIsProcessing(false);
        }
    };

    const filtered = useMemo(() => {
        return requests.filter(r => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = (r.details?.toLowerCase() || "").includes(q) ||
                (r.project?.name?.toLowerCase() || "").includes(q) ||
                (r.user?.full_name?.toLowerCase() || "").includes(q);
            const matchesProject = filterProject === "all" || String(r.project_id) === filterProject;
            const matchesStatus = filterStatus === "all" || r.status === filterStatus;
            const matchesType = filterType === "all" || r.type === filterType;
            return matchesSearch && matchesProject && matchesStatus && matchesType;
        });
    }, [requests, searchQuery, filterProject, filterStatus, filterType]);

    const totalPages = Math.ceil(filtered.length / limit);
    const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterProject, filterStatus, filterType]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Resource Request" description={`${requests.filter(r => r.status === "pending").length} requests need your review`}>
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" onClick={() => setCreateOpen(true)}>
                    + New Request
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="relative w-full md:w-[250px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search requester or details..."
                            className="pl-9 h-10 bg-white border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="h-10 w-[180px] bg-white border-slate-200">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="manpower">Manpower</SelectItem>
                            <SelectItem value="tools">Tools</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                            <SelectItem value="accommodation">Accommodation</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 w-[140px] bg-white border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 h-11">No</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Requester</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Project</TableHead>
                                <TableHead className="w-24 text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Details</TableHead>
                                <TableHead className="w-28 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</TableHead>
                                <TableHead className="w-20 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2568C1]" /></TableCell></TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No requests found.</TableCell></TableRow>
                            ) : (
                                paginated.map((r, idx) => (
                                    <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-center text-sm font-medium text-slate-500">{(currentPage - 1) * limit + idx + 1}</TableCell>
                                        <TableCell>
                                            <p className="text-sm font-semibold text-slate-900">{r.user?.full_name || `User #${r.user_id}`}</p>
                                            <p className="text-[10px] text-slate-500">{r.user?.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm font-medium text-slate-700">{r.project?.name || `Project #${r.project_id}`}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-200">{r.type}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-sm text-slate-600 truncate" title={r.details}>{r.details}</p>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", statusColors[r.status])}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[r.status])} />
                                                <span className="uppercase">{r.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-[#2568C1] hover:bg-blue-50" onClick={() => openDetail(r)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {filtered.length > 0 && (
                    <div className="border-t border-slate-100 bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-slate-900">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * limit, filtered.length)}</span> of <span className="font-medium text-slate-900">{filtered.length}</span> requests
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages || 1}</div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{selectedRequest?.type}</Badge>
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border", selectedRequest && statusColors[selectedRequest.status])}>
                                <div className={cn("w-1 h-1 rounded-full", selectedRequest && statusDotColors[selectedRequest.status])} />
                                <span className="uppercase">{selectedRequest?.status}</span>
                            </div>
                        </div>
                        <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">Request Details</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-xs">ID #{selectedRequest?.id} • {selectedRequest?.project?.name || `Project #${selectedRequest?.project_id}`}</DialogDescription>
                    </div>

                    <div className="px-6 py-5 space-y-6 max-h-[65vh] overflow-y-auto">
                        {detailMode === "edit" ? (
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                                    <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v })}>
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manpower">Manpower</SelectItem>
                                            <SelectItem value="tools">Tools</SelectItem>
                                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                            <SelectItem value="accommodation">Accommodation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Details</label>
                                    <textarea className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value={editForm.details} onChange={e => setEditForm({ ...editForm, details: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Realization Cost (Rp)</label>
                                    <CurrencyInput value={editForm.amount || 0} onChange={v => setEditForm({ ...editForm, amount: Number(v) })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</label>
                                    <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : detailMode === "approve" ? (
                            <div className="space-y-5">
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <p className="text-sm font-medium text-emerald-800">Assign realization cost for this request.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Realization Amount (Rp)</label>
                                    <CurrencyInput value={approveAmount} onChange={v => setApproveAmount(Number(v))} autoFocus />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> Requester</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedRequest?.user?.full_name || `User #${selectedRequest?.user_id}`}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Project</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedRequest?.project?.name || `Project #${selectedRequest?.project_id}`}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> Approved Cost</p>
                                        <p className="text-lg font-black text-[#2568C1]">Rp {selectedRequest?.amount?.toLocaleString("id-ID") || 0}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Requested At</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedRequest?.created_at ? new Date(selectedRequest.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Last Update</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedRequest?.updated_at ? new Date(selectedRequest.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Details</p>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed break-words">{selectedRequest?.details}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3">
                        {detailMode === "edit" ? (
                            <>
                                <Button className="flex-1 bg-[#2568C1]" onClick={() => handleEdit(false)} disabled={isProcessing}>{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setDetailMode("view")}>Cancel</Button>
                            </>
                        ) : detailMode === "approve" ? (
                            <>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(false)} disabled={isProcessing}>Approve Request</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setDetailMode("view")}>Cancel</Button>
                            </>
                        ) : (
                            <>
                                {selectedRequest?.status === "pending" && (
                                    <>
                                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDetailMode("approve")}>Approve</Button>
                                        <Button variant="destructive" className="flex-1" onClick={handleReject}>Reject</Button>
                                    </>
                                )}
                                <Button variant="outline" className="flex-1" onClick={() => setDetailMode("edit")}>Edit</Button>
                                <Button variant="outline" className="w-12 p-0 text-red-600 border-red-100 hover:bg-red-50" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /></Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="h-6 w-6" /></div>
                        <DialogTitle>Delete Request?</DialogTitle>
                        <DialogDescription className="text-center text-slate-500">This action cannot be undone. Permanent removal of Request #{selectedRequest?.id}.</DialogDescription>
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isProcessing}>{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Request Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg font-bold text-slate-900">New Resource Request</DialogTitle>
                        <DialogDescription className="text-xs">Submit a new request for project resources.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Project <span className="text-red-500">*</span></label>
                            <Select value={createForm.project_id} onValueChange={v => setCreateForm({ ...createForm, project_id: v })}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Choose a project" /></SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Type</label>
                            <Select value={createForm.type} onValueChange={v => setCreateForm({ ...createForm, type: v })}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
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
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                placeholder="Describe the resource needed, quantity, and reason..."
                                value={createForm.details}
                                onChange={e => setCreateForm({ ...createForm, details: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setCreateOpen(false)} disabled={isProcessing}>Cancel</Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

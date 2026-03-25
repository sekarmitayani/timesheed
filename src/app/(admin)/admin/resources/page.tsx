"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CheckCircle2, XCircle, Edit, Loader2, Package, Wrench, Users, AlertTriangle, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { resourceService, ResourceRequest, ApprovalActionPayload, EditResourcePayload } from "@/lib/services/resource-service";

const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border-none",
    approved: "bg-emerald-50 text-emerald-600 border-none",
    rejected: "bg-red-50 text-red-500 border-none",
};

export default function AdminResourcesPage() {
    const [requests, setRequests] = useState<ResourceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [search, setSearch] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Detail / Action Dialog
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailTarget, setDetailTarget] = useState<ResourceRequest | null>(null);
    const [detailMode, setDetailMode] = useState<"view" | "approve" | "reject" | "edit">("view");

    // Approve fields
    const [approveAmount, setApproveAmount] = useState<number>(0);
    const [needsConfirmZero, setNeedsConfirmZero] = useState(false);

    // Edit fields
    const [editForm, setEditForm] = useState<EditResourcePayload>({});
    const [editNeedsConfirm, setEditNeedsConfirm] = useState(false);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await resourceService.getResourceRequests();
            setRequests(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to load resource requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    // ---- Open Detail ----
    const openDetail = (r: ResourceRequest, mode: "view" | "approve" | "reject" | "edit" = "view") => {
        setDetailTarget(r);
        setDetailMode(mode);
        setApproveAmount(r.amount || 0);
        setNeedsConfirmZero(false);
        setEditForm({ type: r.type, details: r.details, amount: r.amount, status: r.status });
        setEditNeedsConfirm(false);
        setDetailOpen(true);
    };

    // ---- Approve ----
    const handleApprove = async (confirmZero: boolean = false) => {
        if (!detailTarget) return;
        setIsProcessing(true);
        try {
            const payload: ApprovalActionPayload = {
                status: "approved",
                amount: Number(approveAmount),
                confirm_zero: confirmZero,
            };
            await resourceService.approvalAction(detailTarget.id, payload);
            toast.success("Resource request approved!");
            setDetailOpen(false);
            setNeedsConfirmZero(false);
            fetchRequests();
        } catch (e: any) {
            if (e.data?.need_confirmation || e.message?.includes("confirm_zero") || e.message?.includes("Warning")) {
                setNeedsConfirmZero(true);
                toast.warning("Amount is 0 for non-manpower resource. Confirm to proceed.");
            } else {
                toast.error(e.message || "Failed to approve");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // ---- Reject ----
    const handleReject = async () => {
        if (!detailTarget) return;
        setIsProcessing(true);
        try {
            await resourceService.approvalAction(detailTarget.id, { status: "rejected" });
            toast.success("Resource request rejected");
            setDetailOpen(false);
            fetchRequests();
        } catch (e: any) {
            toast.error(e.message || "Failed to reject");
        } finally {
            setIsProcessing(false);
        }
    };

    // ---- Edit ----
    const handleEdit = async (confirmZero: boolean = false) => {
        if (!detailTarget) return;
        setIsProcessing(true);
        try {
            const payload: EditResourcePayload = { ...editForm, confirm_zero: confirmZero };
            await resourceService.editResource(detailTarget.id, payload);
            toast.success("Resource request updated");
            setDetailOpen(false);
            setEditNeedsConfirm(false);
            fetchRequests();
        } catch (e: any) {
            if (e.data?.need_confirmation || e.message?.includes("confirm_zero") || e.message?.includes("Warning")) {
                setEditNeedsConfirm(true);
                toast.warning("Amount is 0 for non-manpower resource. Confirm to proceed.");
            } else {
                toast.error(e.message || "Failed to update");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const filtered = requests.filter(r =>
        (r.details?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (r.Project?.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (r.User?.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (r.type?.toLowerCase() || "").includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / limit);
    const paginated = filtered.slice((currentPage - 1) * limit, currentPage * limit);

    useEffect(() => { setCurrentPage(1); }, [search]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader title="Resource Requests" description={`${requests.filter(r => r.status === "pending").length} pending requests`} />

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search requests..." className="pl-9 border-[#e2e8f0] focus-visible:ring-[#2568C1]" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-slate-100">
                                    <TableHead className="pl-6 w-[50px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">No</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Requester</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Project</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Type</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="w-[100px] text-[10px] uppercase font-bold tracking-wider text-slate-500 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-48 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin text-[#2568C1] mb-4" /><p>Loading requests...</p></div></TableCell></TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">No resource requests found.</TableCell></TableRow>
                                ) : (
                                    paginated.map((r, index) => {
                                        const globalIndex = (currentPage - 1) * limit + index + 1;
                                        return (
                                            <TableRow key={r.id} className="hover:bg-[#f0f4fa]/50 transition-colors">
                                                <TableCell className="pl-6 text-sm text-slate-500 font-medium">
                                                    {globalIndex}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium">{r.User?.full_name || `User #${r.user_id}`}</span>
                                                </TableCell>
                                                <TableCell className="text-xs">{r.Project?.name || `#${r.project_id}`}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] capitalize gap-1">
                                                        {r.type === "manpower" ? <Users className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                                                        {r.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-[10px] font-bold capitalize rounded-full px-2.5 py-0.5 ${statusColors[r.status]}`}>{r.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-[#2568C1] hover:bg-[#2568C1]/10" onClick={() => openDetail(r)}>
                                                        <Eye className="h-3.5 w-3.5" /> Detail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

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

            {/* Detail / Action Dialog */}
            <Dialog open={detailOpen} onOpenChange={open => !isProcessing && setDetailOpen(open)}>
                <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-[#e2e8f0]">
                    {/* Header */}
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg">Resource Request #{detailTarget?.id}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Submitted by {detailTarget?.User?.full_name || `User #${detailTarget?.user_id}`}
                        </DialogDescription>
                    </div>

                    {/* Detail Info */}
                    <div className="px-6 py-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Project</p>
                                <p className="text-sm font-medium">{detailTarget?.Project?.name || `#${detailTarget?.project_id}`}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Type</p>
                                <Badge variant="outline" className="text-[10px] capitalize gap-1">
                                    {detailTarget?.type === "manpower" ? <Users className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                                    {detailTarget?.type}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Status</p>
                                <Badge variant="outline" className={`text-[10px] font-bold capitalize rounded-full px-2.5 py-0.5 ${statusColors[detailTarget?.status || "pending"]}`}>{detailTarget?.status}</Badge>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Amount</p>
                                <p className="text-sm font-medium">{detailTarget && detailTarget.amount > 0 ? `Rp ${detailTarget.amount.toLocaleString("id-ID")}` : "—"}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Details</p>
                            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{detailTarget?.details || "—"}</p>
                        </div>

                        {/* Approve Form */}
                        {detailMode === "approve" && (
                            <div className="border-t pt-4 space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Realization Amount (Rp)</label>
                                    <CurrencyInput value={approveAmount} onChange={v => { setApproveAmount(Number(v)); setNeedsConfirmZero(false); }} disabled={isProcessing} placeholder="15000000" />
                                </div>
                                {needsConfirmZero && (
                                    <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-amber-800 font-medium">Warning: Amount is Rp 0 for a non-manpower resource.</p>
                                            <p className="text-[10px] text-amber-600">Click &quot;Confirm &amp; Approve&quot; to proceed anyway.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reject Confirmation */}
                        {detailMode === "reject" && (
                            <div className="border-t pt-4">
                                <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-700 font-medium">Are you sure you want to reject this resource request?</p>
                                </div>
                            </div>
                        )}

                        {/* Edit Form */}
                        {detailMode === "edit" && (
                            <div className="border-t pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Type</label>
                                        <Select value={editForm.type || ""} onValueChange={v => setEditForm({ ...editForm, type: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manpower">Manpower</SelectItem>
                                                <SelectItem value="tools">Tools</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={editForm.status || ""} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Details</label>
                                    <Input value={editForm.details || ""} onChange={e => setEditForm({ ...editForm, details: e.target.value })} disabled={isProcessing} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Amount (Rp)</label>
                                    <CurrencyInput value={editForm.amount || 0} onChange={v => { setEditForm({ ...editForm, amount: Number(v) }); setEditNeedsConfirm(false); }} disabled={isProcessing} />
                                </div>
                                {editNeedsConfirm && (
                                    <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-800">Amount is Rp 0 for non-manpower. Click &quot;Confirm &amp; Save&quot; to proceed.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer — Context-sensitive buttons */}
                    <div className="px-6 py-4 border-t bg-[#f8fafc] flex items-center justify-between">
                        {/* Left: action shortcuts in view mode */}
                        <div className="flex gap-2">
                            {detailMode === "view" && detailTarget?.status === "pending" && (
                                <>
                                    <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => setDetailMode("approve")}>
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                    </Button>
                                    <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => setDetailMode("reject")}>
                                        <XCircle className="h-3.5 w-3.5" /> Reject
                                    </Button>
                                </>
                            )}
                            {detailMode === "view" && (
                                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setDetailMode("edit")}>
                                    <Edit className="h-3.5 w-3.5" /> Edit
                                </Button>
                            )}
                        </div>

                        {/* Right: submit/cancel */}
                        <div className="flex gap-3">
                            {detailMode !== "view" && (
                                <Button variant="ghost" size="sm" onClick={() => setDetailMode("view")} disabled={isProcessing}>Back</Button>
                            )}
                            {detailMode === "view" && (
                                <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>Close</Button>
                            )}
                            {detailMode === "approve" && (
                                needsConfirmZero ? (
                                    <Button size="sm" onClick={() => handleApprove(true)} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 min-w-[140px]">
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Approve"}
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={() => handleApprove(false)} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]">
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                                    </Button>
                                )
                            )}
                            {detailMode === "reject" && (
                                <Button size="sm" variant="destructive" onClick={handleReject} disabled={isProcessing} className="min-w-[100px]">
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                                </Button>
                            )}
                            {detailMode === "edit" && (
                                editNeedsConfirm ? (
                                    <Button size="sm" onClick={() => handleEdit(true)} disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 min-w-[130px]">
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Save"}
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={() => handleEdit(false)} disabled={isProcessing} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[100px]">
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

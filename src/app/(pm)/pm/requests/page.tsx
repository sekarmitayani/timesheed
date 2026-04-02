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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
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
import {
    Plus,
    Loader2,
    Search,
    Eye,
    Calendar,
    DollarSign,
    Clock,
    Filter,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resourceService, ResourceRequest, CreateResourcePayload } from "@/lib/services/resource-service";
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

export default function RequestsPage() {
    const [requests, setRequests] = useState<ResourceRequest[]>([]);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [filterProject, setFilterProject] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Create
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState<CreateResourcePayload>({ project_id: 0, type: "tools", details: "" });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Detail Dialog
    const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
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

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterProject, filterStatus]);

    const handleCreate = async () => {
        if (!form.project_id || !form.details.trim()) {
            toast.error("Project and details are required");
            return;
        }
        setIsProcessing(true);
        try {
            await resourceService.createResourceRequest(form);
            toast.success("Request submitted successfully!");
            setCreateOpen(false);
            setForm({ project_id: 0, type: "tools", details: "" });
            fetchData();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit request");
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

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            const matchesSearch = r.details.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProject = filterProject === "all" || String(r.project_id) === filterProject;
            const matchesStatus = filterStatus === "all" || r.status === filterStatus;
            return matchesSearch && matchesProject && matchesStatus;
        });
    }, [requests, searchQuery, filterProject, filterStatus]);

    const totalPages = Math.ceil(filteredRequests.length / limit);
    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return filteredRequests.slice(start, start + limit);
    }, [filteredRequests, currentPage]);

    const handleOpenDetail = (req: ResourceRequest) => {
        setSelectedRequest(req);
        setDetailOpen(true);
    };

    const pendingCount = requests.filter(r => r.status === "pending").length;

    return (
        <div className="space-y-6">
            <PageHeader title="Resource Request" description={`${pendingCount} requests currently pending approval`}>
                <Button size="sm" className="gap-2 bg-[#2568C1] hover:bg-[#1e56a6] text-white shadow-sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" /> New Request
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="relative w-full md:w-[250px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search in details..."
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
                                <TableHead className="w-28 text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Details</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Project</TableHead>
                                <TableHead className="w-32 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</TableHead>
                                <TableHead className="w-20 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2568C1]" /></TableCell></TableRow>
                            ) : paginatedRequests.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">No resource requests found.</TableCell></TableRow>
                            ) : (
                                paginatedRequests.map((req, idx) => (
                                    <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-center text-sm font-medium text-slate-500">{(currentPage - 1) * limit + idx + 1}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 border-none px-2 py-0.5">
                                                {req.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[250px]">
                                            <p className="text-sm font-semibold text-slate-900 truncate" title={req.details}>{req.details}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-slate-600 font-medium">{req.project?.name || `Project #${req.project_id}`}</p>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border", statusColors[req.status])}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[req.status])} />
                                                <span className="uppercase">{req.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-slate-400 hover:text-[#2568C1] hover:bg-blue-50"
                                                onClick={() => handleOpenDetail(req)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {filteredRequests.length > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * limit, filteredRequests.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredRequests.length}</span> requests
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages || 1}</div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[9px] uppercase font-bold">{selectedRequest?.type}</Badge>
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border", selectedRequest && statusColors[selectedRequest.status])}>
                                <div className={cn("w-1 h-1 rounded-full", selectedRequest && statusDotColors[selectedRequest.status])} />
                                <span className="uppercase">{selectedRequest?.status}</span>
                            </div>
                        </div>
                        <DialogTitle className="text-lg font-bold text-slate-900">Request Details</DialogTitle>
                        <DialogDescription className="text-xs">
                            ID #{selectedRequest?.id} • {selectedRequest?.project?.name || `Project #${selectedRequest?.project_id}`}
                        </DialogDescription>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approved Cost</p>
                                <p className="text-base font-black text-[#2568C1]">
                                    {selectedRequest?.amount ? `Rp ${selectedRequest.amount.toLocaleString("id-ID")}` : "Rp 0"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
                                <p className="text-sm font-bold text-slate-800 capitalize">{selectedRequest?.status}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Details</p>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed break-words shadow-inner">
                                {selectedRequest?.details}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created At</p>
                                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    {selectedRequest?.created_at ? new Date(selectedRequest.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                                </p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Update</p>
                                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 justify-end">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    {selectedRequest?.updated_at ? new Date(selectedRequest.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between gap-3">
                        <div className="flex gap-2">
                            {selectedRequest?.status === "pending" && (
                                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs" onClick={() => setDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Request
                                </Button>
                            )}
                        </div>
                        <Button variant="outline" className="px-6" onClick={() => setDetailOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="h-6 w-6" /></div>
                        <DialogTitle>Delete Request?</DialogTitle>
                        <DialogDescription className="text-center text-slate-500 text-xs">
                            Are you sure you want to delete this pending request? This action cannot be undone.
                        </DialogDescription>
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>No, Keep it</Button>
                            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Dialog (existing logic preserved) */}
            <Dialog open={createOpen} onOpenChange={open => !isProcessing && setCreateOpen(open)}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-[#e2e8f0]">
                    <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                        <DialogTitle className="text-lg">New Resource Request</DialogTitle>
                        <DialogDescription className="text-xs">Submit a request for resources needed in your project.</DialogDescription>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Select Project <span className="text-red-500">*</span></label>
                            <Select value={String(form.project_id || "")} onValueChange={v => setForm({ ...form, project_id: Number(v) })}>
                                <SelectTrigger className="bg-white border-slate-200 focus:ring-[#2568C1]"><SelectValue placeholder="Select project" /></SelectTrigger>
                                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Resource Type</label>
                            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                <SelectTrigger className="bg-white border-slate-200 focus:ring-[#2568C1]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manpower">Manpower</SelectItem>
                                    <SelectItem value="tools">Tools</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                    <SelectItem value="accommodation">Accommodation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Requirement Details <span className="text-red-500">*</span></label>
                            <Input value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Describe the resource needed..." disabled={isProcessing} className="bg-white border-slate-200 focus:ring-[#2568C1]" />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={isProcessing}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isProcessing} className="bg-[#2568C1] hover:bg-[#1e56a6] min-w-[110px] text-white">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

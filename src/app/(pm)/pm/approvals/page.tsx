"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ai/ai-components";
import { Inbox, CheckCircle2, XCircle, Loader2, CheckCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { approvalService, ReviewTimesheetPayload } from "@/lib/services/approval-service";
import { TimesheetLog } from "@/lib/services/timesheet-service";

export default function ApprovalsPage() {
    const [inbox, setInbox] = useState<TimesheetLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Reject Dialog
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<TimesheetLog | null>(null);
    const [rejectNote, setRejectNote] = useState("");

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const fetchInbox = async () => {
        setIsLoading(true);
        try {
            const res = await approvalService.getInbox();
            setInbox(Array.isArray(res) ? res : []);
        } catch (e: any) {
            toast.error(e.message || "Failed to load approval inbox");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInbox(); }, []);

    const handleApprove = async (id: number) => {
        setIsProcessing(true);
        try {
            await approvalService.reviewTimesheet(id, { status: "approved" });
            toast.success("Timesheet approved");
            fetchInbox();
        } catch (e: any) {
            toast.error(e.message || "Failed to approve");
        } finally {
            setIsProcessing(false);
        }
    };

    const openReject = (log: TimesheetLog) => {
        setRejectTarget(log);
        setRejectNote("");
        setRejectOpen(true);
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        if (!rejectNote.trim()) { toast.error("Rejection note is required"); return; }
        setIsProcessing(true);
        try {
            await approvalService.reviewTimesheet(rejectTarget.id, { status: "rejected", rejection_note: rejectNote });
            toast.success("Timesheet rejected");
            setRejectOpen(false);
            fetchInbox();
        } catch (e: any) {
            toast.error(e.message || "Failed to reject");
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === inbox.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(inbox.map(l => l.id)));
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) { toast.error("Select at least one timesheet"); return; }
        setIsProcessing(true);
        try {
            const res = await approvalService.bulkAction({
                timesheet_ids: Array.from(selectedIds),
                status: "approved",
            });
            toast.success(`${res.rows_affected} timesheets approved`);
            setSelectedIds(new Set());
            fetchInbox();
        } catch (e: any) {
            toast.error(e.message || "Bulk action failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Approvals Inbox" description={`${inbox.length} pending review${inbox.length !== 1 ? "s" : ""}`}>
                {selectedIds.size > 0 && (
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md" onClick={handleBulkApprove} disabled={isProcessing}>
                        <CheckCheck className="h-4 w-4" /> Approve {selectedIds.size} Selected
                    </Button>
                )}
            </PageHeader>

            <Card className="border-[#e2e8f0] shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[#f8fafc]">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px]">
                                        <input type="checkbox" className="rounded" checked={inbox.length > 0 && selectedIds.size === inbox.length} onChange={toggleSelectAll} />
                                    </TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={8} className="h-48 text-center"><Loader2 className="h-6 w-6 animate-spin text-[#2568C1] mx-auto" /></TableCell></TableRow>
                                ) : inbox.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                                                <p className="text-sm">All caught up! No pending timesheets.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    inbox.map(log => (
                                        <TableRow key={log.id} className={`hover:bg-[#f0f4fa]/50 transition-colors ${selectedIds.has(log.id) ? "bg-blue-50/50" : ""}`}>
                                            <TableCell>
                                                <input type="checkbox" className="rounded" checked={selectedIds.has(log.id)} onChange={() => toggleSelect(log.id)} />
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium">{log.user?.full_name || `User #${log.user_id}`}</span>
                                                {log.user?.email && <div className="text-[10px] text-muted-foreground">{log.user.email}</div>}
                                            </TableCell>
                                            <TableCell><span className="text-xs">{log.project?.name || `Project #${log.project_id}`}</span></TableCell>
                                            <TableCell className="text-xs">{new Date(log.clock_in).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                                            <TableCell className="text-xs">{log.clock_out ? new Date(log.clock_out).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—"}</TableCell>
                                            <TableCell className="text-xs font-medium">{log.duration_minutes > 0 ? `${Math.floor(log.duration_minutes / 60)}h ${log.duration_minutes % 60}m` : "—"}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{log.task_description || "—"}</TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded-full" onClick={() => handleApprove(log.id)} disabled={isProcessing} title="Approve">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-full" onClick={() => openReject(log)} disabled={isProcessing} title="Reject">
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={open => !isProcessing && setRejectOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                        <DialogTitle className="text-center">Reject Timesheet</DialogTitle>
                        <DialogDescription className="text-center text-xs">
                            Rejecting log from <b>{rejectTarget?.user?.full_name || `User #${rejectTarget?.user_id}`}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Rejection Note <span className="text-red-500">*</span></label>
                            <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Explain why this timesheet is being rejected..." disabled={isProcessing} />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2 pt-4">
                        <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isProcessing}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isProcessing} className="min-w-[100px]">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

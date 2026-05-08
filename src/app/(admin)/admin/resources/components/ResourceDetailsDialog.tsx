import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, User as UserIcon, Briefcase, DollarSign, Calendar, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResourceRequest, ApprovalActionPayload, EditResourcePayload } from "@/lib/services/resource-service";

interface ResourceDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: ResourceRequest | null;
    mode: "view" | "approve" | "reject" | "edit";
    setMode: (mode: "view" | "approve" | "reject" | "edit") => void;
    isProcessing: boolean;
    approveAmount: number;
    setApproveAmount: (val: number) => void;
    editForm: EditResourcePayload;
    setEditForm: (form: EditResourcePayload) => void;
    onApprove: (id: number, payload: ApprovalActionPayload) => void;
    onReject: (id: number, payload: ApprovalActionPayload) => void;
    onEdit: (id: number, payload: EditResourcePayload) => void;
    onDelete: () => void;
}

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

export function ResourceDetailsDialog({
    open, onOpenChange, request, mode, setMode, isProcessing,
    approveAmount, setApproveAmount, editForm, setEditForm,
    onApprove, onReject, onEdit, onDelete
}: ResourceDetailsDialogProps) {
    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-[#e2e8f0]">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{request.type}</Badge>
                        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border", statusColors[request.status])}>
                            <div className={cn("w-1 h-1 rounded-full", statusDotColors[request.status])} />
                            <span className="uppercase">{request.status}</span>
                        </div>
                    </div>
                    <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">Request Details</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium text-xs">ID #{request.id} • {request.project?.name || `Project #${request.project_id}`}</DialogDescription>
                </div>

                <div className="px-6 py-5 space-y-6 max-h-[65vh] overflow-y-auto">
                    {mode === "edit" ? (
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
                    ) : mode === "approve" ? (
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
                                    <p className="text-sm font-bold text-slate-800">{request.user?.full_name || `User #${request.user_id}`}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Project</p>
                                    <p className="text-sm font-bold text-slate-800">{request.project?.name || `Project #${request.project_id}`}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> Approved Cost</p>
                                    <p className="text-lg font-black text-[#2568C1]">Rp {request.amount?.toLocaleString("id-ID") || 0}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Requested At</p>
                                    <p className="text-sm font-bold text-slate-800">{request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Last Update</p>
                                    <p className="text-sm font-bold text-slate-800">{request.updated_at ? new Date(request.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Details</p>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed break-words">{request.details}</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3">
                    {mode === "edit" ? (
                        <>
                            <Button className="flex-1 bg-[#2568C1]" onClick={() => onEdit(request.id, editForm)} disabled={isProcessing}>{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
                            <Button variant="outline" className="flex-1" onClick={() => setMode("view")}>Cancel</Button>
                        </>
                    ) : mode === "approve" ? (
                        <>
                            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onApprove(request.id, { status: "approved", amount: approveAmount })} disabled={isProcessing}>Approve Request</Button>
                            <Button variant="outline" className="flex-1" onClick={() => setMode("view")}>Cancel</Button>
                        </>
                    ) : (
                        <>
                            {request.status === "pending" && (
                                <>
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setMode("approve")}>Approve</Button>
                                    <Button variant="destructive" className="flex-1" onClick={() => onReject(request.id, { status: "rejected" })}>Reject</Button>
                                </>
                            )}
                            <Button variant="outline" className="flex-1" onClick={() => setMode("edit")}>Edit</Button>
                            <Button variant="outline" className="w-12 p-0 text-red-600 border-red-100 hover:bg-red-50" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

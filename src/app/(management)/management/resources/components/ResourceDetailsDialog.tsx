import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { ResourceRequest } from "@/lib/services/resource-service";

interface ResourceDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: ResourceRequest | null;
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
    open, onOpenChange, request
}: ResourceDetailsDialogProps) {
    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden border-[#e2e8f0] rounded-md shadow-xl">
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 pr-12 py-4 flex flex-col gap-1">
                    <DialogTitle className="text-base font-bold text-slate-900 leading-tight">Request Details</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Overview of Resource Request #{request.id}
                    </DialogDescription>
                </div>

                <div className="px-6 pt-3.5 pb-5 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Request ID Box */}
                        <div className="p-4 border border-slate-200 rounded-md flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Request ID</p>
                                    <p className="text-lg font-bold text-slate-900">#{request.id}</p>
                                </div>
                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider border", statusColors[request.status])}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", statusDotColors[request.status])} />
                                    <span className="uppercase">{request.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Approved Cost Box */}
                        <div className="p-4 border border-slate-200 rounded-md space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">
                                Approved Cost
                            </p>
                            <p className="text-2xl font-bold text-[#2568C1]">Rp {request.amount?.toLocaleString("id-ID") || 0}</p>
                        </div>

                        {/* Request Information Box */}
                        <div className="p-4 border border-slate-200 rounded-md space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Request Information</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</p>
                                    <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-md">{request.type}</Badge>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Requester</p>
                                    <p className="text-sm font-medium text-slate-900">{request.user?.full_name || `User #${request.user_id}`}</p>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Project</p>
                                    <p className="text-sm font-medium text-slate-900">{request.project?.name || `Project #${request.project_id}`}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Box */}
                        <div className="p-4 border border-slate-200 rounded-md space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Timeline</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requested At</p>
                                    <p className="text-xs font-semibold text-slate-900">{request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Update</p>
                                    <p className="text-xs font-semibold text-slate-900">{request.updated_at ? new Date(request.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-md space-y-3 mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Details</p>
                        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed break-words min-h-[80px]">{request.details}</div>
                    </div>
                </div>

                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
                    <Button variant="outline" className="px-6 rounded-md" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

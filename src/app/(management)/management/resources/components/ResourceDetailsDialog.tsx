import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import { User as UserIcon, Briefcase, DollarSign, Calendar, Clock } from "lucide-react";
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
                </div>

                <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

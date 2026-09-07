import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isProcessing: boolean;
    requestId?: number;
}

export function ConfirmDeleteDialog({
    open, onOpenChange, onConfirm, isProcessing, requestId
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">Delete Request?</DialogTitle>
                        <p className="text-xs text-red-600/80">Confirm Deletion</p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    Are you sure you want to delete Request #{requestId}?
                </div>
                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button variant="outline" className="rounded-md" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button variant="destructive" className="rounded-md min-w-[100px]" onClick={onConfirm} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

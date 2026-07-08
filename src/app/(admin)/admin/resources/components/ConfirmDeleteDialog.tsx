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
            <DialogContent className="sm:max-w-sm">
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <DialogTitle>Delete Request?</DialogTitle>
                    <DialogDescription className="text-center text-slate-500">
                        This action cannot be undone. Permanent removal of Request #{requestId}.
                    </DialogDescription>
                    <div className="flex gap-3 w-full mt-2">
                        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

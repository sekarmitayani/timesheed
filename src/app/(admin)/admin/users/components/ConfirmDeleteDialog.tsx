import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { User } from "@/lib/types";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    isDeleting: boolean;
    onConfirm: () => void;
}

export function ConfirmDeleteDialog({
    open, onOpenChange, user, isDeleting, onConfirm
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
            <DialogContent showCloseButton={false} className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-lg">Remove User Account?</DialogTitle>
                </DialogHeader>
                <div className="text-center text-sm text-[#475569] py-2">
                    Are you sure you want to permanently delete <b className="text-[#0f172a]">{user?.name}</b>?
                    This action cannot be undone and will remove all their system access.
                </div>
                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="w-full sm:w-auto">Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="w-full sm:w-auto min-w-[120px]">
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

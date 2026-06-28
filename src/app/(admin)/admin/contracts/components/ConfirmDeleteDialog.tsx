"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Contract } from "@/lib/services/admin-contracts";
import { User } from "@/lib/types";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: Contract | null;
    allUsers: User[];
    isDeleting: boolean;
    onConfirm: () => void;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    contract,
    allUsers,
    isDeleting,
    onConfirm
}: ConfirmDeleteDialogProps) {
    const user = allUsers.find(u => Number(u.id) === contract?.user_id);

    return (
        <Dialog open={open} onOpenChange={v => !isDeleting && onOpenChange(v)}>
            <DialogContent showCloseButton={false} className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center">Delete Contract Data?</DialogTitle>
                </DialogHeader>
                <div className="text-center text-sm text-slate-500 py-2">
                    This will permanently remove the contract block for <b>{user?.full_name || user?.name || `User #${contract?.user_id}`}</b>. 
                    This action represents data destruction and cannot be undone.
                </div>
                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancel</Button>
                    <Button 
                        variant="destructive" 
                        onClick={onConfirm} 
                        disabled={isDeleting} 
                        className="min-w-[120px]"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Identity"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { User } from "@/lib/types";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    isDeleting: boolean;
    onConfirm: () => void;
    reasons?: string[] | null;
    onDeactivate?: () => void;
    isDeactivating?: boolean;
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    user,
    isDeleting,
    onConfirm,
}: ConfirmDeleteDialogProps) {
    const userName = user?.name || user?.full_name || user?.email || "this user";

    return (
        <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">
                            Delete User Account?
                        </DialogTitle>
                        <p className="text-xs text-red-600/80">Confirm Deletion</p>
                    </div>
                </div>

                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    Are you sure you want to delete <b className="text-slate-800">{userName}</b>? 
                    This user will be moved to Trash &amp; Restore.
                </div>

                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isDeleting}
                        className="rounded-md"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="min-w-[120px] rounded-md"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                        Delete User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

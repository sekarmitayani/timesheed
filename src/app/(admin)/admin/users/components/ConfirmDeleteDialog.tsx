"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
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
    reasons,
    onDeactivate,
    isDeactivating = false,
}: ConfirmDeleteDialogProps) {
    const hasRelations = Boolean(reasons && reasons.length > 0);
    const isBusy = isDeleting || isDeactivating;

    return (
        <Dialog open={open} onOpenChange={(val) => !isBusy && onOpenChange(val)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                        hasRelations ? "bg-amber-100" : "bg-red-100"
                    }`}>
                        <AlertTriangle className={`h-6 w-6 ${
                            hasRelations ? "text-amber-600" : "text-red-600"
                        }`} />
                    </div>
                    <DialogTitle className="text-center">
                        {hasRelations ? "Cannot Delete User" : "Delete User Account?"}
                    </DialogTitle>
                </DialogHeader>

                {hasRelations ? (
                    <div className="space-y-3 py-1">
                        <p className="text-center text-sm text-slate-500">
                            User <b>{user?.name || user?.email}</b> cannot be permanently deleted because they have associated records:
                        </p>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-left max-h-36 overflow-y-auto">
                            <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                                {reasons?.map((reason, idx) => (
                                    <li key={idx} className="font-medium text-slate-800">{reason}</li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-center text-xs text-slate-400">
                            Deactivating this user will revoke their login access while keeping past records intact.
                        </p>
                    </div>
                ) : (
                    <div className="text-center text-sm text-slate-500 py-2">
                        Are you sure you want to permanently delete <b>{user?.name || "this user"}</b>? 
                        This action represents data destruction and cannot be undone.
                    </div>
                )}

                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isBusy}
                    >
                        Cancel
                    </Button>

                    {hasRelations ? (
                        <Button
                            type="button"
                            onClick={onDeactivate}
                            disabled={isBusy}
                            className="bg-[#2568C1] hover:bg-[#1e56a6] text-white font-medium min-w-[170px]"
                        >
                            {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Deactivate User Instead
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={isBusy}
                            className="min-w-[120px]"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Identity"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


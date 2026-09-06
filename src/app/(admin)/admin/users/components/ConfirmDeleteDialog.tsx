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
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className={`px-6 py-4 pr-12 border-b flex items-center gap-3.5 ${
                    hasRelations ? "bg-amber-50/70 border-amber-200/60" : "bg-red-50/60 border-red-100"
                }`}>
                    <div className={`p-2 bg-white rounded-md shadow-sm border ${
                        hasRelations ? "border-amber-200 text-amber-600" : "border-red-200 text-red-600"
                    }`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">
                            {hasRelations ? "Cannot Delete User" : "Delete User Account?"}
                        </DialogTitle>
                        <p className={`text-xs ${
                            hasRelations ? "text-amber-700/80" : "text-red-600/80"
                        }`}>
                            {hasRelations ? "Associated records prevent permanent deletion" : "Permanent data destruction"}
                        </p>
                    </div>
                </div>

                <div className="px-6 pt-3.5 pb-5 space-y-3">
                    {hasRelations ? (
                        <>
                            <p className="text-sm text-slate-600">
                                User <b className="text-slate-800">{user?.name || user?.email}</b> cannot be permanently deleted because they have associated records:
                            </p>
                            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-left max-h-36 overflow-y-auto">
                                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                                    {reasons?.map((reason, idx) => (
                                        <li key={idx} className="font-medium text-slate-800">{reason}</li>
                                    ))}
                                </ul>
                            </div>
                            <p className="text-xs text-slate-400">
                                Deactivating this user will revoke their login access while keeping past records intact.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Are you sure you want to permanently delete <b className="text-slate-800">{user?.name || "this user"}</b>? 
                            This action represents permanent data destruction and cannot be undone.
                        </p>
                    )}
                </div>

                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isBusy}
                        className="rounded-md"
                    >
                        Cancel
                    </Button>

                    {hasRelations ? (
                        <Button
                            type="button"
                            onClick={onDeactivate}
                            disabled={isBusy}
                            className="bg-[#2568C1] hover:bg-[#1e56a6] text-white font-medium min-w-[170px] rounded-md"
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
                            className="min-w-[120px] rounded-md"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Identity"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


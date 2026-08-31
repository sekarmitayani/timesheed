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
import { Badge } from "@/components/ui/badge";
import { 
    AlertTriangle, 
    ShieldAlert, 
    UserX, 
    Trash2, 
    Loader2, 
    CheckCircle2 
} from "lucide-react";
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
            <DialogContent className="sm:max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-xl p-0 overflow-hidden">
                {/* Modal Header */}
                <DialogHeader className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            hasRelations 
                                ? "bg-amber-50 text-amber-600 border-amber-200" 
                                : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                            {hasRelations ? (
                                <ShieldAlert className="h-4 w-4" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block leading-none">
                                User Account Governance
                            </span>
                            <DialogTitle className="text-xs font-bold text-slate-800 mt-1 leading-none">
                                {hasRelations ? "Cannot Permanently Delete User" : "Confirm Permanent Deletion"}
                            </DialogTitle>
                        </div>
                    </div>

                    <Badge 
                        variant="outline" 
                        className={`text-[9px] font-semibold px-2 py-0.5 ${
                            hasRelations 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    >
                        {hasRelations ? "Active Relations Detected" : "Hard Delete"}
                    </Badge>
                </DialogHeader>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                    {hasRelations ? (
                        <>
                            {/* Educational Explanation Box */}
                            <div className="space-y-1.5">
                                <h4 className="text-sm font-bold text-slate-900">
                                    Account is linked to active operational data
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    User <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email}) cannot be permanently deleted from the database because they have the following associated records:
                                </p>
                            </div>

                            {/* Specific Reasons List */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-left max-h-48 overflow-y-auto">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Dependency Breakdown:
                                </div>
                                <ul className="space-y-2 text-xs text-slate-700">
                                    {reasons?.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                            <span className="leading-snug font-medium text-slate-800">{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Safe Deactivation Suggestion */}
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
                                <div className="h-7 w-7 rounded-lg bg-blue-100 text-[#4B7BEC] flex items-center justify-center shrink-0 mt-0.5">
                                    <UserX className="h-4 w-4" />
                                </div>
                                <div className="space-y-1 text-xs">
                                    <span className="font-bold text-slate-800 block">
                                        Recommended Solution: Deactivate User
                                    </span>
                                    <p className="text-slate-600 leading-relaxed">
                                        Deactivating this user will revoke their login credentials immediately while keeping all past timesheets, project milestones, and financial contracts 100% intact for audits.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-2 py-2">
                            <h4 className="text-sm font-bold text-slate-900">
                                Permanently delete user account?
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                                Are you sure you want to permanently delete <span className="font-semibold text-slate-800">{user?.name}</span>? This action is irreversible.
                            </p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isBusy}
                        className="w-full sm:w-auto text-xs border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    >
                        Cancel
                    </Button>

                    {hasRelations ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onDeactivate}
                            disabled={isBusy}
                            className="w-full sm:w-auto text-xs bg-[#4B7BEC] hover:bg-[#385bb5] text-white font-semibold gap-1.5 shadow-xs"
                        >
                            {isDeactivating ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Deactivating...
                                </>
                            ) : (
                                <>
                                    <UserX className="h-3.5 w-3.5" />
                                    Deactivate User Instead
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={onConfirm}
                            disabled={isBusy}
                            className="w-full sm:w-auto text-xs font-semibold gap-1.5 shadow-xs"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Yes, Permanently Delete
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

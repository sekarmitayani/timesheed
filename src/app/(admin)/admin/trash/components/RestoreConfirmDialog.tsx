"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";
import { RestoreItem } from "../hooks/useTrashData";

interface RestoreConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: RestoreItem | null;
    isRestoring: boolean;
    onConfirm: () => void;
}

export function RestoreConfirmDialog({
    open,
    onOpenChange,
    item,
    isRestoring,
    onConfirm,
}: RestoreConfirmDialogProps) {
    if (!item) return null;

    const typeLabel = 
        item.type === "users" ? "User" :
        item.type === "projects" ? "Project" :
        item.type === "contracts" ? "Contract" : "Resource Request";

    return (
        <Dialog open={open} onOpenChange={(val) => !isRestoring && onOpenChange(val)}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
                {/* Header */}
                <div className="bg-blue-50/60 border-b border-blue-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-blue-200 text-[#2568C1]">
                        <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">
                            Restore {typeLabel}?
                        </DialogTitle>
                        <p className="text-xs text-[#2568C1]/90">Reactivate record</p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed space-y-2">
                    <p>
                        Are you sure you want to restore <b className="text-slate-800">{item.title}</b>? 
                        {item.subtitle && (
                            <span className="block text-xs text-slate-500 mt-1">{item.subtitle}</span>
                        )}
                    </p>
                    <p className="text-xs text-slate-500">
                        This record will be recovered from trash and returned to active tables immediately.
                        {item.type === "projects" && (
                            <span className="block mt-1 font-medium text-[#2568C1]">
                                All associated members, tasks, timesheets, and contracts deleted with this project will also be restored.
                            </span>
                        )}
                        {item.type === "users" && (
                            <span className="block mt-1 font-medium text-[#2568C1]">
                                All associated contracts and project assignments deleted with this user will also be restored.
                            </span>
                        )}
                    </p>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isRestoring}
                        className="rounded-md"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isRestoring}
                        className="min-w-[130px] rounded-md bg-[#2568C1] hover:bg-[#1e56a6] text-white"
                    >
                        {isRestoring ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                Restoring...
                            </>
                        ) : (
                            `Restore ${typeLabel}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

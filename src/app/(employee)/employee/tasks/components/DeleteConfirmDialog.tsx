"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
    taskTitle: string;
}

export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    taskTitle
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={open => !isDeleting && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl">
                <div className="bg-red-50/60 border-b border-red-100 px-6 py-4 pr-12 flex items-center gap-3.5">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-red-200 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold text-[#0f172a]">Delete Task?</DialogTitle>
                        <p className="text-xs text-red-600/80">Confirm Deletion</p>
                    </div>
                </div>
                <div className="px-6 pt-3.5 pb-5 text-sm text-slate-600 leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-slate-900">&quot;{taskTitle}&quot;</span>? This task will be removed from the project board.
                </div>
                <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5">
                    <Button variant="outline" className="rounded-md" onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" className="rounded-md min-w-[100px]" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

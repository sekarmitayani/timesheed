"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
            <DialogContent className="sm:max-w-[340px] border-none shadow-2xl rounded-md p-8 bg-white flex flex-col items-center text-center text-slate-900">
                <DialogDescription className="sr-only">Confirmation dialog to delete a task.</DialogDescription>
                <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mb-5">
                    <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900">Delete Task?</DialogTitle>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                    Are you sure you want to delete <span className="text-slate-700 font-bold">"{taskTitle}"</span>? This action is permanent.
                </p>
                <div className="flex gap-3 w-full mt-8">
                    <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1 h-10 font-bold rounded-md text-[10px] uppercase border-slate-200">
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="flex-1 h-10 font-bold rounded-md text-[10px] uppercase shadow-lg shadow-red-100">
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

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
            <DialogContent className="sm:max-w-sm">
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <DialogTitle>Delete Task?</DialogTitle>
                    <DialogDescription className="text-center text-slate-500">
                        Are you sure you want to delete <span className="font-bold text-slate-700">"{taskTitle}"</span>? This action cannot be undone.
                    </DialogDescription>
                    <div className="flex gap-3 w-full mt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
